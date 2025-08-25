# Vercel Subdomain Setup Guide

## Task 11.1: Configure laskuri.energiaykkonen.fi

This guide provides step-by-step instructions for configuring the custom subdomain `laskuri.energiaykkonen.fi` for the energiaykkonen-calculator project.

## Current Status

- ✅ Vercel project "energiaykkonen-calculator" exists and is deployed
- ✅ Project URL: https://energiaykkonen-calculator.vercel.app
- ✅ vercel.json configuration is ready with security headers
- ✅ Technical analysis and research completed

## Required Manual Steps

### Step 1: Add Custom Domain in Vercel Dashboard

1. **Access Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Log in with your account
   - Select the "energiaykkonen-calculator" project

2. **Navigate to Domains**
   - Click on the "Domains" tab in the project dashboard
   - Click the "Add" button

3. **Add the Subdomain**
   - Enter: `laskuri.energiaykkonen.fi`
   - Click "Add"
   - Vercel will show you the required DNS configuration

4. **Note the DNS Information**
   - Vercel will provide a CNAME record value (something like `d1d4fc829fe7bc7c.vercel-dns-017.com`)
   - Write down this value - you'll need it for Step 2

### Step 2: Configure DNS Records

1. **Access Domain Registrar**
   - Log in to the registrar where `energiaykkonen.fi` is managed
   - Navigate to DNS management/DNS settings

2. **Add CNAME Record**
   - Type: `CNAME`
   - Name/Host: `laskuri`
   - Value/Points to: [The value provided by Vercel in Step 1]
   - TTL: Use default (usually 300 or 3600 seconds)

3. **Save the DNS Record**
   - Click Save/Apply changes
   - DNS propagation will begin automatically

### Step 3: Verification

1. **Wait for DNS Propagation**
   - Usually takes 5-60 minutes
   - Can take up to 24 hours in rare cases

2. **Check DNS Propagation**
   - Use online tools like https://dnschecker.org/
   - Search for `laskuri.energiaykkonen.fi` to see if CNAME is propagated

3. **Test the Subdomain**
   - Try accessing `https://laskuri.energiaykkonen.fi`
   - Should show the same content as the Vercel app URL
   - SSL certificate should be automatically provisioned

4. **Verify in Vercel Dashboard**
   - Return to the Domains tab in Vercel
   - The subdomain should show as "Active" with a green checkmark
   - SSL should show as "Active"

## Troubleshooting

### Common Issues

1. **404 Error on Subdomain**
   - Verify the subdomain is correctly added in Vercel
   - Check that DNS CNAME record is correct
   - Wait longer for DNS propagation

2. **SSL Certificate Issues**
   - Usually resolves automatically after DNS is working
   - If persistent, check with Vercel support

3. **DNS Not Propagating**
   - Verify CNAME record syntax is correct
   - Check with domain registrar's support if needed
   - Use DNS checker tools to monitor progress

### Verification Commands

```bash
# Check DNS resolution
nslookup laskuri.energiaykkonen.fi

# Check with dig (more detailed)
dig laskuri.energiaykkonen.fi CNAME

# Test HTTPS access
curl -I https://laskuri.energiaykkonen.fi
```

## Next Steps After Completion

Once the subdomain is working:

1. Update Task 11.1 status to "done"
2. Proceed to Task 11.2: Generate and Document iFrame Embed Code
3. Use the new subdomain URL (`https://laskuri.energiaykkonen.fi`) for all embed code

## Security Notes

- The existing vercel.json configuration includes:
  - Strict Transport Security headers
  - HTTPS redirects
  - These will automatically apply to the subdomain

## Contact Information

If you encounter issues:

- Vercel Documentation: https://vercel.com/docs/projects/domains
- Vercel Support: https://vercel.com/help
- Domain registrar support for DNS issues

---

**Last Updated:** August 24, 2025  
**Related Task:** 11.1 - Configure Vercel Subdomain for laskuri.energiaykkonen.fi
