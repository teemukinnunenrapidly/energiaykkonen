# E1 Calculator - Complete Environment Setup Guide

Comprehensive guide for setting up the E1 Calculator development and production environments, including all required services, API keys, and configuration.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Service Setup](#service-setup)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Testing & Verification](#testing--verification)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## 🔧 Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm, yarn, pnpm, or bun
- **Git**: For version control
- **Code Editor**: VS Code, Cursor, or similar

### Required Accounts

- **Supabase**: Database and authentication service
- **Resend**: Email delivery service
- **Vercel**: Hosting and deployment platform
- **GitHub/GitLab**: Code repository (optional but recommended)

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 2GB free space
- **Network**: Stable internet connection for API calls

## 🌐 Service Setup

### 1. Supabase Setup

#### Creating a Supabase Project

1. **Sign Up/Login**
   - Go to [supabase.com](https://supabase.com)
   - Create account or sign in
   - Verify email address

2. **Create New Project**
   - Click "New Project"
   - Choose organization
   - Enter project name: `e1-calculator`
   - Set database password (save this securely)
   - Choose region (closest to your users)
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-5 minutes
   - Database will be automatically provisioned
   - API keys will be generated

#### Database Configuration

1. **Access SQL Editor**
   - Go to Project Dashboard > SQL Editor
   - Click "New Query"

2. **Create Leads Table**

   ```sql
   -- Create leads table
   CREATE TABLE leads (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

     -- Form inputs
     square_meters INTEGER NOT NULL,
     ceiling_height DECIMAL(3,1) NOT NULL,
     construction_year VARCHAR(20) NOT NULL,
     floors INTEGER NOT NULL,
     heating_type VARCHAR(50) NOT NULL,
     current_heating_cost DECIMAL(10,2) NOT NULL,
     current_energy_consumption INTEGER,
     residents INTEGER NOT NULL,
     hot_water_usage VARCHAR(20) NOT NULL,

     -- Contact info
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     email VARCHAR(255) NOT NULL,
     phone VARCHAR(50) NOT NULL,
     address TEXT,
     city VARCHAR(100),
     contact_preference VARCHAR(20) NOT NULL,
     message TEXT,

     -- Calculations
     energy_need DECIMAL(10,2) NOT NULL,
     annual_savings DECIMAL(10,2) NOT NULL,
     five_year_savings DECIMAL(10,2) NOT NULL,
     ten_year_savings DECIMAL(10,2) NOT NULL,
     payback_years DECIMAL(5,2) NOT NULL,
     co2_reduction DECIMAL(10,2) NOT NULL,

     -- Metadata
     created_at TIMESTAMP DEFAULT NOW(),
     ip_address INET,
     user_agent TEXT,
     source_page VARCHAR(255),
     status VARCHAR(20) DEFAULT 'new'
   );

   -- Create indexes for performance
   CREATE INDEX idx_leads_created_at ON leads(created_at);
   CREATE INDEX idx_leads_status ON leads(status);
   CREATE INDEX idx_leads_email ON leads(email);
   CREATE INDEX idx_leads_city ON leads(city);
   ```

3. **Enable Row Level Security (RLS)**

   ```sql
   -- Enable RLS
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

   -- Create policy for inserting leads (public access)
   CREATE POLICY "Allow public insert" ON leads
     FOR INSERT WITH CHECK (true);

   -- Create policy for admin access (server-side only)
   CREATE POLICY "Allow admin access" ON leads
     FOR ALL USING (true);
   ```

#### Getting API Keys

1. **Access API Settings**
   - Go to Project Dashboard > Settings > API
   - Copy the following values:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **Anon/Public Key**: Long string starting with `eyJ...`

2. **Security Notes**
   - The anon key is safe to expose to the browser
   - Keep the service role key secret (server-side only)
   - Never commit API keys to version control

### 2. Resend Setup

#### Creating a Resend Account

1. **Sign Up**
   - Go to [resend.com](https://resend.com)
   - Click "Get Started"
   - Enter email and create password
   - Verify email address

2. **Add Domain**
   - Go to Domains section
   - Click "Add Domain"
   - Enter your domain (e.g., `energiaykkonen.fi`)
   - Follow DNS verification steps

3. **Create API Key**
   - Go to API Keys section
   - Click "Create API Key"
   - Give it a descriptive name: `E1 Calculator Production`
   - Copy the generated key (starts with `re_`)

#### Email Configuration

1. **Verify Domain**
   - Add required DNS records:
     ```
     Type: TXT
     Name: @
     Value: resend-verification=your-verification-code
     ```
   - Wait for verification (usually 5-10 minutes)

2. **Test Email Sending**
   - Use Resend's test email feature
   - Verify emails are delivered
   - Check spam folder if needed

### 3. Vercel Setup

#### Creating Vercel Account

1. **Sign Up**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub, GitLab, or email
   - Complete account setup

2. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

3. **Login to CLI**
   ```bash
   vercel --login
   ```

#### Project Configuration

1. **Link Repository**

   ```bash
   vercel --link
   ```

2. **Configure Project**
   - Choose project name: `e1-calculator`
   - Set framework preset: Next.js
   - Configure build settings if needed

## 🔐 Environment Configuration

### Environment Variables Structure

Create the following files in your project root:

#### `.env.example` (Template)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here

# Admin Panel Security
ADMIN_PASSWORD=your_secure_admin_password_here

# Optional: Development Overrides
NODE_ENV=development
TASKMASTER_LOG_LEVEL=info
```

#### `.env.local` (Local Development)

```bash
# Copy from .env.example and fill in actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_1234567890abcdef...
ADMIN_PASSWORD=YourSecurePassword123!
```

#### `.env.production` (Production)

```bash
# Production values (different from development)
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_production_key_here...
ADMIN_PASSWORD=ProductionSecurePassword456!
```

### Security Considerations

#### Password Requirements

- **Minimum Length**: 12 characters
- **Complexity**: Mix of uppercase, lowercase, numbers, symbols
- **Uniqueness**: Different from other accounts
- **Regular Updates**: Change every 90 days

#### API Key Security

- **Never commit** API keys to Git
- **Use different keys** for development and production
- **Rotate keys** regularly
- **Monitor usage** for suspicious activity

## 💻 Local Development

### Initial Setup

1. **Clone Repository**

   ```bash
   git clone [your-repository-url]
   cd E1-calculator
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Edit with your actual values
   nano .env.local
   # or use your preferred editor
   ```

4. **Database Setup**
   - Ensure Supabase project is active
   - Verify database table exists
   - Test connection with a simple query

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format

# Test email system
npm run test:email

# Full email testing
npm run test:email:full
```

### Development Workflow

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Access Applications**
   - Calculator: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin`

3. **Make Changes**
   - Edit source files
   - See changes in real-time
   - Test functionality

4. **Test Features**
   - Submit test calculations
   - Check email delivery
   - Verify admin panel access

## 🚀 Production Deployment

### Vercel Deployment

1. **Push to Repository**

   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Automatic Deployment**
   - Vercel automatically detects changes
   - Builds and deploys automatically
   - Usually completes in 2-5 minutes

3. **Manual Deployment** (if needed)
   ```bash
   vercel --prod
   ```

### Environment Configuration

1. **Set Production Variables**
   - Go to Vercel Dashboard > Your Project
   - Navigate to Settings > Environment Variables
   - Add each variable with production values

2. **Environment Variable Types**
   - **Production**: Used in production builds
   - **Preview**: Used in preview deployments
   - **Development**: Used in development builds

3. **Variable Priority**
   - Production variables override all others
   - Preview variables override development
   - Development variables are fallback

### Post-Deployment Verification

1. **Test Calculator**
   - Complete a test calculation
   - Verify form submission works
   - Check data is saved to database

2. **Test Email System**
   - Submit test calculation
   - Verify customer email is sent
   - Verify sales notification is sent

3. **Test Admin Panel**
   - Access admin panel
   - Verify lead data is visible
   - Test CSV export functionality

4. **Check Analytics**
   - Verify Vercel Analytics are working
   - Check page view tracking
   - Monitor performance metrics

## 🧪 Testing & Verification

### Local Testing

#### Calculator Testing

1. **Form Validation**
   - Test all form fields
   - Verify validation messages
   - Test edge cases

2. **Calculation Accuracy**
   - Test with known values
   - Verify calculation results
   - Check for rounding errors

3. **Email Testing**
   - Test email templates
   - Verify email delivery
   - Check email formatting

#### Admin Panel Testing

1. **Authentication**
   - Test login with correct password
   - Test login with incorrect password
   - Verify session management

2. **Data Management**
   - Test lead viewing
   - Test search and filtering
   - Test CSV export

### Production Testing

#### End-to-End Testing

1. **Complete User Journey**
   - Navigate to calculator
   - Complete calculation form
   - Verify results display
   - Check email delivery

2. **Performance Testing**
   - Test page load times
   - Verify mobile responsiveness
   - Check cross-browser compatibility

3. **Integration Testing**
   - Test WordPress iframe embedding
   - Verify database connections
   - Check email delivery

### Testing Tools

#### Built-in Testing

```bash
# Email system validation
npm run test:email

# Full email testing suite
npm run test:email:full

# Form validation testing
node scripts/test-form-validation.js

# Iframe integration testing
bash scripts/test-iframe-integration.sh
```

#### Manual Testing Checklist

- [ ] Calculator loads correctly
- [ ] Form validation works
- [ ] Calculations are accurate
- [ ] Emails are sent
- [ ] Admin panel is accessible
- [ ] Data export works
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 🐛 Troubleshooting

### Common Issues

#### Environment Variable Problems

1. **Variables Not Loading**

   ```bash
   # Check file location
   ls -la .env*

   # Verify file format
   cat .env.local

   # Restart development server
   npm run dev
   ```

2. **Wrong Values**
   - Double-check API keys
   - Verify URLs are correct
   - Ensure no extra spaces or quotes

#### Database Connection Issues

1. **Connection Failed**
   - Check Supabase project status
   - Verify URL and API key
   - Check network connectivity

2. **Table Not Found**
   - Run SQL creation script
   - Check table permissions
   - Verify RLS policies

#### Email Delivery Problems

1. **Emails Not Sending**
   - Verify Resend API key
   - Check domain verification
   - Review email templates

2. **Emails in Spam**
   - Check domain reputation
   - Verify SPF/DKIM records
   - Test with different email providers

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variables
export NODE_ENV=development
export TASKMASTER_LOG_LEVEL=debug

# Start development server
npm run dev
```

### Getting Help

1. **Check Logs**
   - Browser console errors
   - Server-side logs
   - Vercel deployment logs

2. **Verify Configuration**
   - Environment variables
   - Service settings
   - API permissions

3. **Contact Support**
   - Supabase support for database issues
   - Resend support for email issues
   - Vercel support for deployment issues

## 🔒 Security Best Practices

### Access Control

1. **Admin Panel Security**
   - Use strong passwords
   - Change passwords regularly
   - Monitor access logs
   - Limit admin access

2. **API Key Management**
   - Rotate keys regularly
   - Use different keys per environment
   - Monitor key usage
   - Revoke compromised keys

### Data Protection

1. **Input Validation**
   - Sanitize all user inputs
   - Validate data formats
   - Prevent SQL injection
   - Block malicious content

2. **Privacy Compliance**
   - GDPR compliance
   - Data retention policies
   - User consent management
   - Data export/deletion

### Infrastructure Security

1. **HTTPS Enforcement**
   - Automatic SSL via Vercel
   - Secure cookie settings
   - HSTS headers
   - CSP policies

2. **Rate Limiting**
   - API rate limiting
   - Form submission limits
   - IP-based restrictions
   - DDoS protection

---

## 📞 Support & Resources

### Documentation

- **README.md**: Project overview and setup
- **ADMIN_GUIDE.md**: Admin panel usage
- **This Guide**: Environment setup

### External Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

### Contact Information

- **Developer Support**: [Your Contact Info]
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Resend Support**: [resend.com/support](https://resend.com/support)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

_Last updated: August 2025_
_Environment Setup Guide version: 1.0_
_For technical support, contact the development team_
