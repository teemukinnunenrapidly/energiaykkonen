# SSL Verification Guide for Energiaykkönen Calculator

This guide covers SSL verification and enforcement for the Energiaykkönen Calculator application deployed on Vercel.

## Overview

The application is configured with comprehensive SSL security measures including:

- Automatic HTTPS enforcement via Vercel
- Security headers configuration
- Automated SSL verification script
- Production domain: `https://laskuri.energiaykkonen.fi`

## Security Headers Implemented

### Next.js Configuration (`next.config.ts`)

The following security headers are automatically applied to all routes:

1. **Strict-Transport-Security**: Forces HTTPS for 1 year, includes subdomains
2. **X-Frame-Options**: Prevents clickjacking attacks (DENY)
3. **X-Content-Type-Options**: Prevents MIME type sniffing
4. **X-XSS-Protection**: Enables browser XSS protection
5. **Referrer-Policy**: Controls referrer information sharing
6. **Content-Security-Policy**: Restricts resource loading sources

### Vercel Configuration (`vercel.json`)

Additional platform-level security:

- HSTS header enforcement
- HTTP to HTTPS redirects for static assets

## SSL Verification Process

### Automated Testing

Use the provided script to verify SSL configuration:

```bash
# Test production domain
./scripts/verify-ssl.sh https://laskuri.energiaykkonen.fi

# Test any other domain
./scripts/verify-ssl.sh https://your-domain.com
```

### Manual Verification Steps

1. **Browser Check**:
   - Visit the site and verify padlock icon appears
   - Check certificate details in browser
   - Ensure no mixed content warnings

2. **Developer Tools**:
   - Open Network tab and verify all requests use HTTPS
   - Check Security tab for certificate information
   - Verify security headers in Response Headers

3. **Online SSL Testing**:
   - Use [SSL Labs](https://www.ssllabs.com/ssltest/) for comprehensive testing
   - Check [DigiCert SSL Checker](https://www.digicert.com/help/)

## Deployment Requirements

### Before Deployment

1. Ensure domain is properly configured in Vercel
2. Verify DNS settings point to Vercel
3. Check that environment variables are set

### After Deployment

1. Run SSL verification script
2. Test all application functionality over HTTPS
3. Verify email links use HTTPS URLs
4. Check that API endpoints enforce HTTPS

## SSL Certificate Management

### Vercel Automatic SSL

- Vercel automatically provisions and renews Let's Encrypt certificates
- Certificates are automatically renewed before expiration
- No manual intervention required for certificate management

### Custom Domain Setup

1. Add domain in Vercel project settings
2. Configure DNS records as instructed by Vercel
3. Wait for SSL certificate provisioning (usually < 30 minutes)
4. Verify certificate using verification script

## Troubleshooting

### Common Issues

1. **Certificate Not Provisioning**:
   - Check DNS configuration
   - Verify domain ownership
   - Ensure no conflicting DNS records

2. **Mixed Content Warnings**:
   - Update all internal links to use HTTPS
   - Check external resource URLs
   - Verify API calls use HTTPS

3. **Security Headers Not Applied**:
   - Redeploy application after config changes
   - Check Next.js configuration syntax
   - Verify Vercel deployment logs

### Testing Commands

```bash
# Check certificate expiration
echo | openssl s_client -servername laskuri.energiaykkonen.fi -connect laskuri.energiaykkonen.fi:443 2>/dev/null | openssl x509 -noout -dates

# Test HTTP to HTTPS redirect
curl -I -L http://laskuri.energiaykkonen.fi

# Check security headers
curl -I https://laskuri.energiaykkonen.fi

# Verify TLS version
echo | openssl s_client -servername laskuri.energiaykkonen.fi -connect laskuri.energiaykkonen.fi:443 2>/dev/null | grep Protocol
```

## Security Best Practices

1. **Always use HTTPS URLs** in:
   - Email templates
   - API endpoints
   - Internal redirects
   - External links

2. **Regular SSL Health Checks**:
   - Run verification script monthly
   - Monitor certificate expiration
   - Check for security warnings

3. **Content Security Policy**:
   - Review and update CSP rules as needed
   - Test thoroughly when adding new external resources
   - Monitor browser console for CSP violations

## Implementation Status

- ✅ Security headers configuration
- ✅ Vercel SSL enforcement
- ✅ SSL verification script
- ✅ Documentation complete
- ⏳ Domain deployment (pending)
- ⏳ Production SSL testing (pending deployment)

## Next Steps

1. Deploy application to Vercel with custom domain
2. Run SSL verification script on live domain
3. Test all functionality over HTTPS
4. Monitor SSL certificate status
5. Set up monitoring for security headers

---

_This guide is part of Task 12.1: Verify and Enforce SSL for All Deployments_
