# E1 Calculator - Update Process & Troubleshooting Guide

Comprehensive guide for managing updates, changes, and troubleshooting common issues with the E1 Calculator system.

## 📋 Table of Contents

- [Update Process Overview](#update-process-overview)
- [Version Control Practices](#version-control-practices)
- [Deployment Workflow](#deployment-workflow)
- [Change Management](#change-management)
- [Common Issues & Solutions](#common-issues--solutions)
- [Troubleshooting Procedures](#troubleshooting-procedures)
- [Support & Escalation](#support--escalation)
- [Maintenance Schedule](#maintenance-schedule)

## 🔄 Update Process Overview

### Change Request Workflow

The E1 Calculator follows a streamlined update process designed for quick turnaround and minimal disruption:

```
Client Request → Development → Testing → Deployment → Verification
      ↓              ↓          ↓         ↓           ↓
   Document      Code        Local    Push to     Confirm
   Changes      Changes     Testing   Main      Live Status
```

### Update Types

#### 1. **Quick Changes** (Same Day)

- Text updates and translations
- Minor styling adjustments
- Bug fixes
- Configuration changes

#### 2. **Feature Updates** (1-3 Days)

- New form fields
- Calculation formula adjustments
- Email template updates
- Admin panel enhancements

#### 3. **Major Changes** (1 Week+)

- New calculator types
- Database schema changes
- Third-party integrations
- Performance optimizations

## 📚 Version Control Practices

### Git Workflow

#### Branch Strategy

```
main (production) ← Always deployable
    ↑
feature/update-name ← Feature development
    ↑
hotfix/urgent-fix ← Emergency fixes
```

#### Commit Standards

**Commit Message Format:**

```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation update
- style: Code formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance tasks
```

**Examples:**

```bash
feat(calculator): add solar panel calculation option
fix(admin): resolve CSV export date formatting issue
docs(readme): update deployment instructions
style(ui): improve button hover states
```

#### Code Review Process

1. **Self-Review**
   - Test changes locally
   - Verify functionality
   - Check for obvious issues

2. **Peer Review** (if available)
   - Code quality check
   - Logic verification
   - Security review

3. **Client Review** (for major changes)
   - Feature demonstration
   - User acceptance testing
   - Final approval

### Repository Management

#### File Organization

```
E1-calculator/
├── src/                    # Source code
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── docs/                   # Documentation
├── .taskmaster/           # Task management
└── README.md              # Project overview
```

#### Ignored Files

- `.env.local` (environment variables)
- `.next/` (build output)
- `node_modules/` (dependencies)
- `.vercel/` (deployment cache)

## 🚀 Deployment Workflow

### Automated Deployment

#### Vercel Integration

- **Trigger**: Push to `main` branch
- **Build**: Automatic Next.js build
- **Deploy**: Live in 2-5 minutes
- **Rollback**: Available via Vercel dashboard

#### Deployment Steps

1. **Prepare Changes**

   ```bash
   # Ensure all changes are committed
   git status
   git add .
   git commit -m "feat: description of changes"
   ```

2. **Push to Main**

   ```bash
   git push origin main
   ```

3. **Monitor Deployment**
   - Check Vercel dashboard
   - Monitor build logs
   - Verify deployment success

4. **Post-Deployment Verification**
   - Test calculator functionality
   - Verify admin panel access
   - Check email delivery
   - Monitor error logs

### Manual Deployment (if needed)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel --login

# Deploy manually
vercel --prod
```

### Environment Management

#### Development vs Production

```bash
# Development (.env.local)
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
RESEND_API_KEY=re_dev_key_123

# Production (Vercel Dashboard)
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
RESEND_API_KEY=re_prod_key_456
```

#### Environment Variable Updates

1. **Vercel Dashboard Method**
   - Go to Project Settings > Environment Variables
   - Add/Update variables
   - Redeploy to apply changes

2. **CLI Method**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add RESEND_API_KEY
   vercel env add ADMIN_PASSWORD
   ```

## 📝 Change Management

### Change Request Template

**Standard Change Request:**

```
Change Type: [Feature/Bug Fix/Enhancement]
Priority: [High/Medium/Low]
Description: [Detailed description of requested change]
Business Justification: [Why this change is needed]
Expected Outcome: [What should happen after the change]
Timeline: [When the change is needed]
Testing Requirements: [How to verify the change works]
```

### Approval Process

#### Minor Changes (Same Day)

- **Requirement**: Client request via email/chat
- **Approval**: Verbal confirmation
- **Implementation**: Immediate development
- **Deployment**: Same day if possible

#### Major Changes (1 Week+)

- **Requirement**: Formal change request document
- **Approval**: Written client approval
- **Implementation**: Scheduled development
- **Deployment**: Planned deployment window

### Change Documentation

#### Update Log

- **Date**: When change was implemented
- **Change**: What was modified
- **Reason**: Why the change was made
- **Impact**: What users will notice
- **Rollback**: How to undo if needed

#### Version History

```
v1.0.0 (Current)
├── Initial MVP release
├── Multi-step calculator
├── Lead capture system
├── Admin panel
└── Email notifications

v1.1.0 (Planned)
├── Enhanced analytics
├── Additional calculation options
├── Improved mobile experience
└── Performance optimizations
```

## 🐛 Common Issues & Solutions

### Calculator Issues

#### 1. **Calculator Not Loading**

**Symptoms:**

- Blank page or error message
- JavaScript errors in console
- Network connection failures

**Solutions:**

```bash
# Check environment variables
cat .env.local

# Verify Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check Vercel deployment status
vercel ls
```

**Quick Fix:**

1. Verify domain is accessible
2. Check browser console for errors
3. Confirm environment variables are set
4. Restart development server

#### 2. **Form Submission Fails**

**Symptoms:**

- Form doesn't submit
- Error messages appear
- Data not saved to database

**Solutions:**

```bash
# Test database connection
node scripts/test-supabase-connection.js

# Verify email service
npm run test:email

# Check form validation
node scripts/test-form-validation.js
```

**Quick Fix:**

1. Check Supabase project status
2. Verify Resend API key
3. Test form validation rules
4. Check network connectivity

#### 3. **Calculations Incorrect**

**Symptoms:**

- Wrong savings amounts
- Incorrect payback periods
- Formula errors

**Solutions:**

```bash
# Review calculation logic
cat src/lib/calculations.ts

# Test with known values
# Compare expected vs actual results
```

**Quick Fix:**

1. Verify input values are correct
2. Check calculation formulas
3. Test with edge cases
4. Update calculation logic if needed

### Admin Panel Issues

#### 1. **Admin Login Fails**

**Symptoms:**

- Password not accepted
- Access denied errors
- Redirect loops

**Solutions:**

```bash
# Check admin password
echo $ADMIN_PASSWORD

# Verify environment variable
grep ADMIN_PASSWORD .env.local

# Test authentication logic
node -e "console.log(process.env.ADMIN_PASSWORD)"
```

**Quick Fix:**

1. Reset admin password in environment
2. Clear browser cache and cookies
3. Verify admin route configuration
4. Check server logs for errors

#### 2. **Leads Not Displaying**

**Symptoms:**

- Empty leads table
- "No data" messages
- Loading errors

**Solutions:**

```bash
# Check database connection
node scripts/verify-table-structure.js

# Verify data exists
# Test admin data functions
```

**Quick Fix:**

1. Verify Supabase connection
2. Check table permissions
3. Verify RLS policies
4. Test data queries

#### 3. **CSV Export Fails**

**Symptoms:**

- Export button doesn't work
- Incomplete data
- File download errors

**Solutions:**

```bash
# Test export functionality
# Verify file permissions
# Check data completeness
```

**Quick Fix:**

1. Check browser download settings
2. Verify data selection
3. Test with smaller datasets
4. Check server logs

### Email System Issues

#### 1. **Emails Not Sending**

**Symptoms:**

- No email delivery
- Error messages
- Missing notifications

**Solutions:**

```bash
# Test email system
npm run test:email

# Verify Resend configuration
# Check email templates
```

**Quick Fix:**

1. Verify Resend API key
2. Check domain verification
3. Test email templates
4. Monitor delivery logs

#### 2. **Email Formatting Issues**

**Symptoms:**

- Broken layouts
- Missing content
- Styling problems

**Solutions:**

```bash
# Review email templates
cat src/lib/email-templates/customer-results.tsx

# Test email rendering
# Verify CSS compatibility
```

**Quick Fix:**

1. Update email templates
2. Test with different email clients
3. Use inline CSS
4. Simplify layouts

### Performance Issues

#### 1. **Slow Page Loading**

**Symptoms:**

- Long load times
- Unresponsive interface
- Timeout errors

**Solutions:**

```bash
# Check bundle size
npm run build

# Analyze performance
# Monitor resource usage
```

**Quick Fix:**

1. Optimize images and assets
2. Enable caching
3. Minimize JavaScript bundles
4. Use CDN for static assets

#### 2. **Database Performance**

**Symptoms:**

- Slow queries
- Connection timeouts
- High resource usage

**Solutions:**

```bash
# Check database indexes
# Monitor query performance
# Optimize database queries
```

**Quick Fix:**

1. Add database indexes
2. Optimize SQL queries
3. Enable query caching
4. Monitor connection limits

## 🔧 Troubleshooting Procedures

### Systematic Approach

#### 1. **Identify the Problem**

- **What**: What exactly is not working?
- **When**: When did it start happening?
- **Where**: Which part of the system is affected?
- **Who**: Who is experiencing the issue?

#### 2. **Gather Information**

- **Error Messages**: Copy exact error text
- **Console Logs**: Check browser and server logs
- **User Actions**: What steps led to the issue?
- **Environment**: Browser, device, network conditions

#### 3. **Reproduce the Issue**

- **Test Steps**: Follow the same user actions
- **Environment**: Use similar conditions
- **Data**: Use the same or similar data
- **Timing**: Note when the issue occurs

#### 4. **Analyze Root Cause**

- **Code Review**: Check recent changes
- **Configuration**: Verify settings and environment
- **Dependencies**: Check external services
- **Logs**: Analyze error logs and stack traces

#### 5. **Implement Solution**

- **Quick Fix**: Temporary solution if needed
- **Proper Fix**: Permanent solution
- **Testing**: Verify the fix works
- **Documentation**: Update procedures if needed

### Debug Tools

#### Browser Developer Tools

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check console for errors
console.log('Debug information');

// Monitor network requests
// Check Application tab for storage
```

#### Server-Side Debugging

```bash
# Enable debug mode
export NODE_ENV=development
export TASKMASTER_LOG_LEVEL=debug

# Check server logs
npm run dev

# Monitor file changes
# Check environment variables
```

#### Database Debugging

```sql
-- Check table structure
\d leads

-- Verify data exists
SELECT COUNT(*) FROM leads;

-- Test queries
SELECT * FROM leads LIMIT 5;
```

### Testing Procedures

#### Local Testing

```bash
# Start development server
npm run dev

# Test calculator functionality
# Verify admin panel access
# Test email delivery
# Check data persistence
```

#### Production Testing

```bash
# Deploy to staging (if available)
vercel --staging

# Test in production environment
# Verify all integrations work
# Check performance metrics
# Monitor error logs
```

## 📞 Support & Escalation

### Support Levels

#### Level 1: Self-Service

- **Documentation**: README, guides, troubleshooting
- **Common Issues**: Known problems and solutions
- **Basic Configuration**: Environment setup and changes

#### Level 2: Developer Support

- **Technical Issues**: Code problems, bugs, performance
- **Integration Issues**: Third-party service problems
- **Configuration Issues**: Complex setup problems

#### Level 3: Emergency Support

- **System Down**: Complete service failure
- **Data Loss**: Database or file corruption
- **Security Issues**: Breaches or vulnerabilities

### Contact Information

#### Primary Support

- **Developer**: [Your Name/Contact]
- **Email**: [your-email@domain.com]
- **Phone**: [your-phone-number]
- **Response Time**: Within 4 hours during business hours

#### Emergency Support

- **After Hours**: [emergency-contact]
- **Critical Issues**: [emergency-phone]
- **Response Time**: Within 1 hour for critical issues

#### External Services

- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Resend Support**: [resend.com/support](https://resend.com/support)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

### Escalation Process

#### Escalation Triggers

1. **Service Down**: Calculator not accessible
2. **Data Loss**: Leads or calculations missing
3. **Security Breach**: Unauthorized access
4. **Performance Issues**: Slow response times
5. **Integration Failures**: Email or database not working

#### Escalation Steps

1. **Immediate Response**: Acknowledge issue within 15 minutes
2. **Assessment**: Evaluate impact and urgency
3. **Communication**: Update stakeholders on status
4. **Resolution**: Implement fix or workaround
5. **Follow-up**: Document lessons learned

### Support Request Template

```
Subject: [Issue Type] - E1 Calculator Support Request

Priority: [High/Medium/Low]
Issue Description: [Detailed description of the problem]
Steps to Reproduce: [How to recreate the issue]
Expected Behavior: [What should happen]
Actual Behavior: [What is happening instead]
Environment: [Browser, device, network]
Error Messages: [Any error text or codes]
Screenshots: [If applicable]
Impact: [How this affects users/business]
```

## 📅 Maintenance Schedule

### Regular Maintenance

#### Daily

- **Monitoring**: Check system status
- **Logs**: Review error logs
- **Performance**: Monitor response times
- **Backups**: Verify data integrity

#### Weekly

- **Data Review**: Check lead generation trends
- **Performance**: Analyze system metrics
- **Security**: Review access logs
- **Updates**: Check for dependency updates

#### Monthly

- **Backup Verification**: Test restore procedures
- **Security Review**: Audit access and permissions
- **Performance Analysis**: Review trends and patterns
- **Documentation**: Update procedures and guides

#### Quarterly

- **Security Assessment**: Comprehensive security review
- **Performance Optimization**: Identify improvement opportunities
- **Feature Planning**: Plan future enhancements
- **Client Review**: Gather feedback and requirements

### Preventive Maintenance

#### Database Maintenance

```sql
-- Regular cleanup
DELETE FROM leads WHERE created_at < NOW() - INTERVAL '2 years';

-- Index optimization
REINDEX TABLE leads;

-- Statistics update
ANALYZE leads;
```

#### Code Maintenance

```bash
# Update dependencies
npm update

# Security audits
npm audit

# Code quality checks
npm run lint
npm run type-check
```

#### Infrastructure Maintenance

- **SSL Certificates**: Monitor expiration dates
- **Domain Renewals**: Track domain registration
- **Service Subscriptions**: Monitor billing and limits
- **Backup Storage**: Verify backup integrity

### Emergency Procedures

#### System Recovery

1. **Assessment**: Determine scope of issue
2. **Communication**: Notify stakeholders
3. **Recovery**: Implement recovery procedures
4. **Verification**: Confirm system functionality
5. **Documentation**: Record incident details

#### Data Recovery

1. **Backup Restoration**: Restore from latest backup
2. **Data Validation**: Verify data integrity
3. **Service Restoration**: Restore affected services
4. **User Notification**: Inform users of resolution
5. **Incident Review**: Analyze what went wrong

---

## 📋 Quick Reference

### Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality

# Testing
npm run test:email   # Test email system
npm run type-check   # TypeScript validation

# Deployment
vercel --prod        # Deploy to production
vercel --staging     # Deploy to staging
```

### Emergency Contacts

- **Developer**: [Your Contact]
- **Client**: Energiaykkönen Oy
- **Hosting**: Vercel Support
- **Database**: Supabase Support
- **Email**: Resend Support

### Key URLs

- **Production**: [your-domain.com](https://your-domain.com)
- **Admin Panel**: [your-domain.com/admin](https://your-domain.com/admin)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)

---

_Last updated: August 2025_
_Update Process & Troubleshooting Guide version: 1.0_
_For support, contact the development team_
