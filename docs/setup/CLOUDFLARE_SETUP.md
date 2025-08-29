# Cloudflare Images Setup Guide

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudflare Account ID (found in Cloudflare dashboard)
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Cloudflare Images API Token (create with Images:Edit permissions)
CLOUDFLARE_IMAGES_API_TOKEN=your_api_token_here

# Cloudflare Account Hash (found in Images dashboard)
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH=your_account_hash_here
```

## How to Get These Values

### 1. CLOUDFLARE_ACCOUNT_ID

- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Look at the URL: `https://dash.cloudflare.com/<account_id>`
- The account ID is the string after `/dash/`

### 2. CLOUDFLARE_IMAGES_API_TOKEN

- Go to [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Click "Create Token"
- Use "Custom token" template
- Set permissions:
  - **Zone**: Images:Edit
  - **Account**: Images:Edit
- Set zone resources to "Include: All zones" or specific zones
- Create token and copy the value

### 3. NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH

- Go to [Cloudflare Dashboard > Images](https://dash.cloudflare.com/images)
- Look for "Account Hash" in the right sidebar
- Copy this value

## Features Now Available

✅ **Image Upload**: Direct upload to Cloudflare Images  
✅ **Image Deletion**: Automatic cleanup when removing from visual objects  
✅ **Multiple Variants**: Support for public, thumbnail, avatar, cover variants  
✅ **File Validation**: Type and size validation before upload  
✅ **Bulk Upload**: Upload multiple images at once  
✅ **Metadata**: Track upload time and original filename  
✅ **Secure API Routes**: Server-side upload/delete endpoints  
✅ **Client-Side Security**: No API tokens exposed to browser

## API Routes

The system uses secure server-side API routes for all Cloudflare operations:

- **`POST /api/admin/upload-image`** - Upload images to Cloudflare
- **`DELETE /api/admin/delete-image?imageId=<id>`** - Delete images from Cloudflare

These routes handle authentication, validation, and secure communication with Cloudflare's API.

## Usage Examples

```typescript
// Upload single image (automatically uses secure API route)
const imageId = await uploadToCloudflare(file);

// Get image URL with variant
const publicUrl = getCloudflareImageUrl(imageId, 'public');
const thumbnailUrl = getCloudflareImageUrl(imageId, 'thumbnail');

// Upload multiple images
const imageIds = await uploadMultipleToCloudflare(files);

// Validate file before upload
const validation = validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
}

// Delete image (automatically uses secure API route)
await deleteFromCloudflare(imageId);
```

## Security Notes

- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_IMAGES_API_TOKEN` are server-side only
- `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH` is public (safe to expose)
- API token has minimal required permissions (Images:Edit only)
- Images are automatically served through Cloudflare's CDN
- **All Cloudflare API calls go through secure server-side routes** (`/api/admin/upload-image`, `/api/admin/delete-image`)
- Client-side code never sees the API token or account ID
