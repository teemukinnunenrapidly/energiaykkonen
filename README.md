# E1 Calculator - Heat Pump Savings Calculator

A professional web calculator for Energiaykkönen Oy that calculates potential savings from heat pump installation and captures qualified leads. Built with Next.js, featuring a multi-step form, real-time calculations, and comprehensive admin panel.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- Resend account for email services

### Local Development

```bash
# Clone the repository
git clone [repository-url]
cd E1-calculator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Production Deployment

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Environment Setup](#-environment-setup)
- [Admin Panel Usage](#-admin-panel-usage)
- [Deployment](#-deployment)
- [Maintenance & Updates](#-maintenance--updates)
- [Troubleshooting](#-troubleshooting)
- [Support](#-support)

## ✨ Features

### Calculator Features

- **Multi-step form** with progress tracking
- **Real-time calculations** for heat pump savings
- **Responsive design** optimized for mobile and desktop
- **Lead capture** with comprehensive customer data
- **Email notifications** to customers and sales team

### Admin Panel Features

- **Secure authentication** with password protection
- **Leads management** with search and filtering
- **CSV export** for data analysis
- **Analytics dashboard** with key metrics
- **Real-time statistics** and reporting

### Technical Features

- **TypeScript** for type safety
- **Tailwind CSS** for modern styling
- **shadcn/ui** components for consistent UI
- **Supabase** for database and authentication
- **Resend** for reliable email delivery
- **Vercel** for hosting and analytics
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.0, React 19.1.0, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## 📁 Project Structure

```
E1-calculator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin panel pages
│   │   ├── api/               # API routes
│   │   ├── calculator/        # Calculator page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── admin/            # Admin panel components
│   │   ├── calculator/       # Calculator components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utility libraries
│   │   ├── calculations.ts   # Calculation engine
│   │   ├── supabase.ts       # Database client
│   │   ├── email-service.ts  # Email functionality
│   │   └── validation.ts     # Form validation
│   └── hooks/                # Custom React hooks
├── public/                   # Static assets
├── scripts/                  # Utility scripts
└── .taskmaster/             # Task management
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Admin Panel Security
ADMIN_PASSWORD=your_secure_admin_password
```

### Getting API Keys

1. **Supabase**: Go to [supabase.com](https://supabase.com), create a project, and get your URL and anon key from Project Settings > API
2. **Resend**: Sign up at [resend.com](https://resend.com) and create an API key from your dashboard
3. **Admin Password**: Set a strong password (12+ characters, mix of letters, numbers, symbols)

### Local Development Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your actual API keys
3. Run `npm run dev` to start development server
4. Access calculator at `http://localhost:3000`
5. Access admin panel at `http://localhost:3000/admin`

## 🔐 Admin Panel Usage

### Accessing the Admin Panel

1. Navigate to `/admin` on your domain
2. Enter the admin password (set in environment variables)
3. You'll be redirected to the main admin dashboard

### Managing Leads

#### Viewing Leads

- **Leads Table**: Shows all captured leads with pagination
- **Search**: Use the search bar to find specific leads
- **Filters**: Filter by status, date range, savings amount
- **Pagination**: Navigate through large numbers of leads

#### Lead Status Management

- **New**: Recently submitted leads
- **Contacted**: Leads that have been contacted
- **Qualified**: Leads that meet qualification criteria
- **Converted**: Leads that became customers

#### Exporting Data

1. Click the "Export CSV" button
2. Choose date range if needed
3. Download the CSV file for analysis
4. Import into your CRM or spreadsheet software

### Analytics Dashboard

#### Key Metrics

- **Total Leads**: Overall lead count
- **Daily/Weekly/Monthly**: Lead generation trends
- **Conversion Rates**: Lead-to-customer ratios
- **Savings Distribution**: Range of calculated savings

#### Using Analytics

- Monitor lead generation trends
- Identify peak submission times
- Track conversion performance
- Plan marketing campaigns

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**

   ```bash
   vercel --login
   vercel --link
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all required environment variables
   - Set production values (different from development)

3. **Deploy**
   ```bash
   git push origin main
   # Vercel automatically deploys on push
   ```

### Environment Configuration

**Production Environment Variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
RESEND_API_KEY=your_production_resend_key
ADMIN_PASSWORD=your_production_admin_password
```

### Post-Deployment Verification

1. **Test Calculator**: Complete a test calculation
2. **Verify Emails**: Check email delivery
3. **Test Admin Panel**: Access admin with production credentials
4. **Check Analytics**: Verify Vercel Analytics are working

## 🔄 Maintenance & Updates

### Update Process

1. **Client Request**: Receive change request from client
2. **Development**: Make changes in development environment
3. **Testing**: Test locally and verify functionality
4. **Deployment**: Push to main branch for automatic deployment
5. **Verification**: Confirm changes are live and working

### Common Updates

- **Calculation Formula**: Adjust savings calculations
- **Form Fields**: Add or modify form inputs
- **Text Changes**: Update copy, translations, or branding
- **Styling**: Modify colors, fonts, or layout
- **New Features**: Add additional functionality

### Version Control

- All changes are tracked in Git
- Main branch deploys automatically to production
- Feature branches for complex changes
- Commit messages should be descriptive and clear

## 🐛 Troubleshooting

### Common Issues

#### Calculator Not Loading

- Check if the domain is accessible
- Verify environment variables are set correctly
- Check browser console for JavaScript errors
- Ensure Supabase project is active

#### Emails Not Sending

- Verify Resend API key is correct
- Check Resend dashboard for delivery status
- Verify email templates are properly configured
- Check server logs for error messages

#### Admin Panel Access Issues

- Confirm admin password is set correctly
- Check if environment variables are loaded
- Verify the admin route is accessible
- Clear browser cache and cookies

#### Database Connection Problems

- Verify Supabase URL and anon key
- Check if Supabase project is active
- Verify database tables exist and are properly structured
- Check network connectivity

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
TASKMASTER_LOG_LEVEL=debug
```

### Performance Issues

- **Slow Loading**: Check image optimization and bundle size
- **Database Queries**: Monitor Supabase query performance
- **Email Delivery**: Check Resend delivery rates
- **Analytics**: Monitor Vercel Analytics for bottlenecks

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and related guides
2. **Code Comments**: Review inline code documentation
3. **Git History**: Check commit messages for context
4. **Environment Setup**: Verify all configuration is correct

### Contact Information

- **Developer**: [Your Name/Contact]
- **Client**: Energiaykkönen Oy
- **Project Repository**: [GitHub/GitLab URL]
- **Deployment**: [Vercel Dashboard URL]

### Emergency Procedures

1. **Service Down**: Check Vercel status and project health
2. **Data Loss**: Contact Supabase support for database issues
3. **Security Breach**: Immediately change admin password and API keys
4. **Performance Issues**: Scale up Vercel plan if needed

## 📊 Performance Metrics

### Key Performance Indicators

- **Lead Generation**: Target 150+ leads/month
- **Conversion Rate**: Target 20%+ lead-to-customer
- **Form Completion**: Target 60%+ completion rate
- **Page Load Time**: Target <3 seconds
- **Uptime**: Target 99.9% availability

### Monitoring

- **Vercel Analytics**: Track page views and performance
- **Supabase Dashboard**: Monitor database performance
- **Resend Dashboard**: Track email delivery rates
- **Custom Logs**: Monitor application-specific metrics

---

## 📝 License

This project is proprietary software developed for Energiaykkönen Oy. All rights reserved.

## 🔄 Changelog

### Version 1.0.0 (Current)

- Initial MVP release
- Multi-step calculator form
- Lead capture and management
- Admin panel with analytics
- Email notifications
- Responsive design
- GDPR compliance

---

_Last updated: September 2025_
_Documentation version: 1.0_
