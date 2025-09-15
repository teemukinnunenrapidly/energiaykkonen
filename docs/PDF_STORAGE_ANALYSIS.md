# PDF Storage Analysis

## Current Implementation

### Storage Architecture

- **Location**: Supabase Storage (NOT in database)
- **Database**: Only stores URL reference in `form_data` JSONB field (~200 bytes)
- **Actual PDFs**: Stored in Supabase Storage bucket `lead-pdfs`
- **Access**: Public URLs for direct download

### PDF Size Analysis

- **Single PDF size**: ~8.5 KB
- **Very small** compared to typical PDFs (usually 100-500 KB)
- Our PDFs are text-only, no images, which keeps them tiny

## Storage Projections

| Leads   | Period    | Storage Needed | Cost            |
| ------- | --------- | -------------- | --------------- |
| 100     | Month     | 0.83 MB        | Free            |
| 1,200   | Year      | 10 MB          | Free            |
| 6,000   | 5 Years   | 50 MB          | Free            |
| 12,000  | 10 Years  | 100 MB         | Free            |
| 120,000 | 100 Years | 1 GB           | Free tier limit |

## Cost Analysis

### Supabase Storage Tiers

1. **Free Tier** (Current)
   - 1 GB storage included
   - Sufficient for ~120,000 PDFs
   - No additional cost

2. **Pro Tier** ($25/month)
   - 100 GB storage
   - Would handle 12 million PDFs
   - Overkill for most businesses

### Real-World Estimates

- **Small Business** (10 leads/month)
  - Annual storage: 1 MB
  - 10-year storage: 10 MB
  - **Cost: $0 (free tier)**

- **Medium Business** (100 leads/month)
  - Annual storage: 10 MB
  - 10-year storage: 100 MB
  - **Cost: $0 (free tier)**

- **Large Business** (1,000 leads/month)
  - Annual storage: 100 MB
  - 10-year storage: 1 GB
  - **Cost: $0 (free tier for 10 years)**

## ✅ Current Setup is Optimal

**Why the current setup is perfect:**

1. **PDFs are NOT in the database**
   - Database only stores URL (200 bytes)
   - No database bloat
   - Fast queries

2. **Supabase Storage is ideal**
   - Built-in CDN
   - Direct public URLs
   - Automatic backups
   - No separate infrastructure needed

3. **Extremely efficient**
   - 8.5 KB per PDF is tiny
   - Would need 120,000+ leads to hit 1 GB
   - Most businesses never reach this

## Optimization Options (If Ever Needed)

### 1. PDF Retention Policy

```sql
-- Delete PDFs older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'lead-pdfs'
AND created_at < NOW() - INTERVAL '90 days';
```

### 2. On-Demand Generation

- Don't store PDFs at all
- Generate when requested
- Pros: Zero storage
- Cons: Slower, more CPU usage

### 3. Compression

- Current PDFs are uncompressed
- Could reduce by ~30-50%
- Not worth the complexity given tiny size

### 4. Alternative Storage (Only for 1M+ PDFs)

- **Cloudflare R2**: $0.015/GB/month (cheaper)
- **AWS S3**: $0.023/GB/month
- **Backblaze B2**: $0.005/GB/month (cheapest)

## Recommendations

### For Now (0-10,000 leads)

✅ **Keep current setup - it's perfect**

- Free
- Simple
- Integrated
- Fast

### When to Consider Changes

1. **At 100,000 PDFs** (~1 GB)
   - Option A: Upgrade to Supabase Pro ($25/month)
   - Option B: Implement 90-day retention
   - Option C: Move to Cloudflare R2 (cheaper)

2. **Never likely to need**
   - The current setup can handle 120,000 PDFs for free
   - That's 1,000 leads/month for 10 years

## Summary

**Your PDFs take almost no space:**

- Database impact: **Zero** (only URL stored)
- Storage impact: **Minimal** (8.5 KB each)
- Cost impact: **Free** for first 120,000 PDFs
- Performance impact: **None**

**No action needed** - the current architecture is excellent and will scale to 100,000+ leads without any changes or costs.
