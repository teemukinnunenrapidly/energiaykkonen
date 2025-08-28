# Visual Support Component Implementation Plan

## Overview

Implement a three-tier visual support system that displays contextual images based on:

1. **Section** - Default image for form sections
2. **Field** - Image when field is focused
3. **Option** - Specific image when an option is selected

Images are managed through the Form Builder and served via Cloudflare Images CDN.

## System Architecture

### Image Hierarchy

```
Section (e.g., "heating")
  ├── Default section image
  └── Fields (e.g., "lämmitysmuoto")
      ├── Default field image
      └── Options (e.g., "Öljylämmitys", "Sähkölämmitys")
          └── Option-specific images
```

Priority: Option image > Field image > Section image

## Implementation Steps

### Step 1: Database Schema

**Location:** Supabase SQL Editor

```sql
CREATE TABLE visual_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cloudflare_image_id VARCHAR(255) NOT NULL,

  -- Hierarchical identifiers
  section_id VARCHAR(255),      -- Form section identifier
  field_id VARCHAR(255),        -- Form field identifier
  option_value VARCHAR(255),    -- Option value (for select/radio)

  -- Asset metadata
  asset_type VARCHAR(50) NOT NULL, -- 'section'/'field'/'option'
  title VARCHAR(255) NOT NULL,
  help_text TEXT,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique combinations
  UNIQUE(section_id, field_id, option_value)
);

-- Indexes for performance
CREATE INDEX idx_visual_assets_hierarchy
  ON visual_assets(section_id, field_id, option_value);
CREATE INDEX idx_visual_assets_type
  ON visual_assets(asset_type);
```

### Step 2: Environment Variables

**Location:** `.env.local`

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_IMAGES_API_TOKEN=your_api_token
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH=your_account_hash
```

### Step 3: Supabase Types and Helpers

**Location:** `src/lib/supabase.ts` (add to existing)

```typescript
export interface VisualAsset {
  id: string;
  cloudflare_image_id: string;
  section_id?: string;
  field_id?: string;
  option_value?: string;
  asset_type: 'section' | 'field' | 'option';
  title: string;
  help_text?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Get the most specific asset based on hierarchy
export async function getVisualAsset(
  sectionId?: string,
  fieldId?: string,
  optionValue?: string
): Promise<VisualAsset | null> {
  // Try option level first
  if (optionValue && fieldId) {
    const { data } = await supabase
      .from('visual_assets')
      .select('*')
      .eq('field_id', fieldId)
      .eq('option_value', optionValue)
      .single();
    if (data) return data;
  }

  // Try field level
  if (fieldId) {
    const { data } = await supabase
      .from('visual_assets')
      .select('*')
      .eq('field_id', fieldId)
      .is('option_value', null)
      .single();
    if (data) return data;
  }

  // Fall back to section level
  if (sectionId) {
    const { data } = await supabase
      .from('visual_assets')
      .select('*')
      .eq('section_id', sectionId)
      .is('field_id', null)
      .is('option_value', null)
      .single();
    if (data) return data;
  }

  return null;
}

// Get all assets for form builder management
export async function getVisualAssetsForField(fieldId: string) {
  const { data } = await supabase
    .from('visual_assets')
    .select('*')
    .eq('field_id', fieldId)
    .order('display_order');

  return data || [];
}
```

### Step 4: Cloudflare Client

**Location:** `src/lib/cloudflare.ts` (new file)

```typescript
export class CloudflareImages {
  private accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  private apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN!;
  private accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH!;

  async upload(file: File, metadata?: Record<string, string>) {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiToken}` },
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.result;
  }

  getUrl(imageId: string, variant = 'public'): string {
    return `https://imagedelivery.net/${this.accountHash}/${imageId}/${variant}`;
  }

  async delete(imageId: string) {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.apiToken}` },
      }
    );
  }
}
```

### Step 5: Upload API Endpoint

**Location:** `src/app/api/admin/visual-assets/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CloudflareImages } from '@/lib/cloudflare';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const sectionId = formData.get('sectionId') as string | null;
  const fieldId = formData.get('fieldId') as string | null;
  const optionValue = formData.get('optionValue') as string | null;
  const title = formData.get('title') as string;
  const helpText = formData.get('helpText') as string | null;

  // Determine asset type
  let assetType: 'section' | 'field' | 'option';
  if (optionValue) assetType = 'option';
  else if (fieldId) assetType = 'field';
  else assetType = 'section';

  // Upload to Cloudflare
  const cloudflare = new CloudflareImages();
  const { id: cloudflareId } = await cloudflare.upload(file, {
    sectionId: sectionId || '',
    fieldId: fieldId || '',
    optionValue: optionValue || '',
  });

  // Save to database
  const { data, error } = await supabase
    .from('visual_assets')
    .upsert({
      cloudflare_image_id: cloudflareId,
      section_id: sectionId || undefined,
      field_id: fieldId || undefined,
      option_value: optionValue || undefined,
      asset_type: assetType,
      title,
      help_text: helpText || undefined,
    })
    .select()
    .single();

  if (error) {
    await cloudflare.delete(cloudflareId);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    asset: data,
    url: cloudflare.getUrl(cloudflareId),
  });
}
```

### Step 6: VisualSupport Component

**Location:** `src/components/form-system/VisualSupport.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getVisualAsset, type VisualAsset } from '@/lib/supabase';

interface VisualSupportProps {
  sectionId?: string;
  fieldId?: string;
  fieldValue?: string;  // Selected option value
  className?: string;
}

export const VisualSupport: React.FC<VisualSupportProps> = ({
  sectionId,
  fieldId,
  fieldValue,
  className = ''
}) => {
  const [asset, setAsset] = useState<VisualAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAsset = async () => {
      setLoading(true);
      try {
        const data = await getVisualAsset(sectionId, fieldId, fieldValue);
        setAsset(data);
      } catch (error) {
        console.error('Failed to load visual asset:', error);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId || fieldId) {
      loadAsset();
    }
  }, [sectionId, fieldId, fieldValue]);

  const getImageUrl = (cloudflareId: string) => {
    const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
    return `https://imagedelivery.net/${hash}/${cloudflareId}/public`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center p-8">
          <p className="text-gray-500">
            Valitse kenttä nähdäksesi ohjeet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      <div className="relative h-96">
        <img
          src={getImageUrl(asset.cloudflare_image_id)}
          alt={asset.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white text-xl font-bold">{asset.title}</h3>
        </div>
      </div>

      {asset.help_text && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
          <p className="text-sm text-gray-700">{asset.help_text}</p>
        </div>
      )}
    </div>
  );
};
```

### Step 7: FormRenderer Integration

**Location:** `src/components/form-system/FormRenderer.tsx`

Add these props and handlers:

```typescript
interface FormRendererProps {
  // ... existing props
  onContextChange?: (context: {
    sectionId?: string;
    fieldId?: string;
    fieldValue?: string;
  }) => void;
}

// Example field implementation:
<div onFocus={() => onContextChange?.({
  sectionId: 'heating',
  fieldId: 'lämmitysmuoto'
})}>
  <select
    onChange={(e) => onContextChange?.({
      sectionId: 'heating',
      fieldId: 'lämmitysmuoto',
      fieldValue: e.target.value
    })}
  >
    <option value="Öljylämmitys">Öljylämmitys</option>
    <option value="Sähkölämmitys">Sähkölämmitys</option>
  </select>
</div>
```

### Step 8: Calculator Page Integration

**Location:** `src/app/calculator/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FormRenderer } from '@/components/form-system/FormRenderer';
import { VisualSupport } from '@/components/form-system/VisualSupport';

export default function CalculatorPage() {
  const [context, setContext] = useState({
    sectionId: undefined,
    fieldId: undefined,
    fieldValue: undefined,
  });

  return (
    <div className="flex h-screen">
      <div className="w-2/5 border-r">
        <VisualSupport
          sectionId={context.sectionId}
          fieldId={context.fieldId}
          fieldValue={context.fieldValue}
          className="h-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <FormRenderer
          onContextChange={setContext}
        />
      </div>
    </div>
  );
}
```

### Step 9: Form Builder Integration

**Location:** Admin panel form builder

Add image upload controls at three levels:

```typescript
// Section level
<ImageUpload
  label="Section Default Image"
  onUpload={(file) => uploadAsset(file, {
    sectionId: currentSection.id
  })}
/>

// Field level
<ImageUpload
  label="Field Help Image"
  onUpload={(file) => uploadAsset(file, {
    sectionId: currentSection.id,
    fieldId: currentField.id
  })}
/>

// Option level (for select/radio fields)
{field.options.map(option => (
  <ImageUpload
    label={`Image for ${option.label}`}
    onUpload={(file) => uploadAsset(file, {
      sectionId: currentSection.id,
      fieldId: currentField.id,
      optionValue: option.value
    })}
  />
))}
```

## Example Usage

### Heating System Field Example

1. **Section Image**: General heating systems overview
   - `section_id: "heating"`
   - Shows when user enters heating section

2. **Field Image**: "How to identify your heating system"
   - `field_id: "lämmitysmuoto"`
   - Shows when field is focused

3. **Option Images**: Specific system images
   - `option_value: "Öljylämmitys"` → Oil tank image
   - `option_value: "Sähkölämmitys"` → Electric heater image
   - `option_value: "Kaukolämpö"` → District heating image

## Testing Checklist

- [ ] Section default image displays when entering section
- [ ] Field image displays when focusing field
- [ ] Option image displays when selecting option
- [ ] Image hierarchy works (option > field > section)
- [ ] Images load from Cloudflare CDN
- [ ] Upload works from Form Builder
- [ ] Help text displays correctly
- [ ] Loading states work properly
- [ ] Mobile responsive layout

## Next Steps

1. Set up Cloudflare Images account
2. Create database table with new schema
3. Update FormRenderer to emit context events
4. Implement VisualSupport component
5. Test with sample images
6. Add upload UI to Form Builder
