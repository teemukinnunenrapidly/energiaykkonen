# E1 Calculator - Admin Panel User Guide

Complete guide for managing the E1 Calculator admin panel, including lead management, data export, analytics, and system administration.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Admin Panel Overview](#admin-panel-overview)
- [Lead Management](#lead-management)
- [Data Export](#data-export)
- [Analytics & Reporting](#analytics--reporting)
- [System Administration](#system-administration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🚀 Getting Started

### Accessing the Admin Panel

1. **Navigate to Admin URL**
   - Go to: `https://your-domain.com/admin`
   - Or locally: `http://localhost:3000/admin`

2. **Authentication**
   - Enter the admin password (set in environment variables)
   - Click "Login" to access the dashboard

3. **Security Note**
   - The admin panel is password-protected
   - Use a strong, unique password
   - Change password regularly for security

### First-Time Setup

1. **Verify Access**
   - Confirm you can log in successfully
   - Check that all dashboard sections load properly
   - Verify data is displaying correctly

2. **Configure Preferences**
   - Set your preferred date format
   - Configure export settings if needed
   - Review notification preferences

## 🏠 Admin Panel Overview

### Dashboard Layout

The admin panel is organized into several key sections:

```
┌─────────────────────────────────────────────────────────┐
│                    Header Navigation                     │
├─────────────────────────────────────────────────────────┤
│  Statistics Dashboard (Key Metrics)                     │
├─────────────────────────────────────────────────────────┤
│  Analytics Dashboard (Charts & Trends)                  │
├─────────────────────────────────────────────────────────┤
│  Search & Filters (Lead Discovery)                     │
├─────────────────────────────────────────────────────────┤
│  Leads Table (Main Data View)                          │
├─────────────────────────────────────────────────────────┤
│  Pagination Controls                                    │
└─────────────────────────────────────────────────────────┘
```

### Key Components

- **Statistics Dashboard**: Overview of lead generation and performance
- **Analytics Dashboard**: Detailed charts and trend analysis
- **Search & Filters**: Tools for finding specific leads
- **Leads Table**: Main data view with all captured leads
- **Export Controls**: Data export functionality

## 👥 Lead Management

### Understanding Lead Data

Each lead contains comprehensive information:

#### Property Details

- **Square Meters**: Property size in m²
- **Ceiling Height**: Building ceiling height
- **Construction Year**: When the building was constructed
- **Number of Floors**: Building height
- **Residents**: Number of people living in the property

#### Current Heating Information

- **Heating Type**: Oil, Electric, District, or Other
- **Annual Cost**: Current yearly heating expenses
- **Energy Consumption**: Current energy usage (kWh/year)

#### Contact Information

- **Name**: First and last name
- **Email**: Contact email address
- **Phone**: Contact phone number
- **Address**: Street address and city
- **Contact Preference**: Preferred communication method

#### Calculation Results

- **Energy Need**: Calculated annual energy requirement
- **Annual Savings**: Potential yearly savings with heat pump
- **5-Year Savings**: 5-year cumulative savings
- **10-Year Savings**: 10-year cumulative savings
- **Payback Period**: Time to recoup investment
- **CO2 Reduction**: Environmental impact reduction

### Lead Status Management

#### Status Categories

1. **New** (Blue)
   - Recently submitted leads
   - Require immediate attention
   - Should be contacted within 24 hours

2. **Contacted** (Yellow)
   - Initial contact has been made
   - Awaiting customer response
   - Follow up scheduled

3. **Qualified** (Green)
   - Customer shows genuine interest
   - Meets qualification criteria
   - Ready for sales process

4. **Converted** (Purple)
   - Successfully converted to customer
   - Sale completed
   - Archive after 30 days

#### Updating Lead Status

1. **Select Lead**: Click on the lead row to expand details
2. **Change Status**: Use the status dropdown in the expanded view
3. **Add Notes**: Include relevant information about the contact
4. **Save Changes**: Click save to update the record

### Lead Search & Filtering

#### Search Functionality

- **Global Search**: Search across all lead fields
- **Real-time Results**: Results update as you type
- **Fuzzy Matching**: Finds partial matches and typos

#### Advanced Filters

1. **Date Range Filter**
   - Filter by submission date
   - Use date picker for precise selection
   - Quick filters: Today, This Week, This Month

2. **Status Filter**
   - Filter by lead status
   - Multiple status selection
   - Exclude specific statuses

3. **Savings Filter**
   - Filter by minimum/maximum savings
   - Focus on high-value leads
   - Identify budget-conscious customers

4. **Location Filter**
   - Filter by city or region
   - Geographic targeting
   - Local marketing campaigns

#### Filter Combinations

- **Multiple Filters**: Combine several filters for precise results
- **Saved Filters**: Save common filter combinations
- **Filter Reset**: Clear all filters with one click

## 📊 Data Export

### CSV Export Functionality

#### Export Options

1. **Full Export**
   - Export all leads in the system
   - Complete data set
   - Use for comprehensive analysis

2. **Filtered Export**
   - Export only filtered results
   - Targeted data extraction
   - Campaign-specific analysis

3. **Date Range Export**
   - Export leads from specific time period
   - Monthly/quarterly reporting
   - Performance analysis

#### Export Process

1. **Prepare Data**
   - Apply desired filters
   - Verify data selection
   - Check export size

2. **Generate Export**
   - Click "Export CSV" button
   - Wait for file generation
   - Download when ready

3. **File Management**
   - Save with descriptive filename
   - Include date in filename
   - Organize by export type

#### CSV File Structure

The exported CSV contains all lead fields:

```csv
id,first_name,last_name,email,phone,address,city,square_meters,ceiling_height,construction_year,floors,heating_type,current_heating_cost,residents,energy_need,annual_savings,five_year_savings,ten_year_savings,payback_years,co2_reduction,created_at,status
```

#### Importing to Other Systems

1. **CRM Systems**
   - Salesforce, HubSpot, Pipedrive
   - Map fields appropriately
   - Verify data integrity

2. **Spreadsheet Software**
   - Excel, Google Sheets, Numbers
   - Use for analysis and reporting
   - Create custom dashboards

3. **Marketing Tools**
   - Email marketing platforms
   - Campaign management
   - Lead scoring

## 📈 Analytics & Reporting

### Statistics Dashboard

#### Key Metrics Overview

1. **Lead Generation**
   - Total leads count
   - New leads today
   - Leads this week/month

2. **Performance Metrics**
   - Conversion rates
   - Average savings
   - Response times

3. **Trend Analysis**
   - Daily/weekly patterns
   - Seasonal variations
   - Growth trends

### Analytics Dashboard

#### Charts & Visualizations

1. **Lead Generation Trends**
   - Line chart showing lead volume over time
   - Identify peak submission periods
   - Track growth patterns

2. **Savings Distribution**
   - Histogram of calculated savings
   - Identify customer segments
   - Focus marketing efforts

3. **Geographic Distribution**
   - Map or chart of lead locations
   - Regional performance analysis
   - Local marketing opportunities

4. **Conversion Funnel**
   - Visual representation of lead progression
   - Identify drop-off points
   - Optimize conversion process

#### Using Analytics for Decision Making

1. **Marketing Optimization**
   - Identify best performing channels
   - Optimize campaign timing
   - Target high-value segments

2. **Sales Process Improvement**
   - Identify conversion bottlenecks
   - Optimize follow-up timing
   - Improve qualification criteria

3. **Business Intelligence**
   - Market trend analysis
   - Customer behavior insights
   - Strategic planning support

## ⚙️ System Administration

### User Management

#### Admin Access Control

1. **Password Management**
   - Use strong, unique passwords
   - Change passwords regularly
   - Never share admin credentials

2. **Access Logging**
   - Monitor login attempts
   - Track admin actions
   - Security audit trail

### System Configuration

#### Environment Variables

Key configuration settings:

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Email Configuration
RESEND_API_KEY=your_resend_key

# Security Configuration
ADMIN_PASSWORD=your_admin_password
```

#### Performance Settings

1. **Database Optimization**
   - Monitor query performance
   - Optimize database indexes
   - Regular maintenance

2. **Caching Strategy**
   - Browser caching
   - CDN optimization
   - Database query caching

### Backup & Recovery

#### Data Backup

1. **Regular Exports**
   - Weekly CSV exports
   - Database backups
   - Configuration backups

2. **Backup Storage**
   - Secure cloud storage
   - Multiple backup locations
   - Regular backup testing

#### Disaster Recovery

1. **Recovery Procedures**
   - Database restoration
   - Application redeployment
   - Data recovery verification

2. **Business Continuity**
   - Minimal downtime procedures
   - Alternative access methods
   - Communication protocols

## 🐛 Troubleshooting

### Common Issues

#### Login Problems

1. **Password Issues**
   - Verify password is correct
   - Check for typos
   - Reset password if necessary

2. **Access Denied**
   - Check environment variables
   - Verify admin route configuration
   - Check server logs

#### Data Display Issues

1. **Empty Tables**
   - Check database connection
   - Verify data exists
   - Check filter settings

2. **Missing Data**
   - Verify data integrity
   - Check for data corruption
   - Review error logs

#### Export Problems

1. **Export Fails**
   - Check file permissions
   - Verify disk space
   - Check for data errors

2. **Incomplete Data**
   - Verify filter settings
   - Check data completeness
   - Review export logic

### Performance Issues

#### Slow Loading

1. **Database Performance**
   - Check query performance
   - Optimize database indexes
   - Monitor connection limits

2. **Application Performance**
   - Check server resources
   - Monitor response times
   - Optimize code execution

#### Memory Issues

1. **Browser Performance**
   - Clear browser cache
   - Close unnecessary tabs
   - Update browser version

2. **Server Performance**
   - Monitor memory usage
   - Check for memory leaks
   - Optimize resource usage

### Getting Help

#### Self-Service Resources

1. **Documentation**
   - This admin guide
   - README file
   - Code comments

2. **Troubleshooting Guides**
   - Common issues
   - Error codes
   - Solution steps

#### Support Channels

1. **Developer Support**
   - Technical issues
   - Bug reports
   - Feature requests

2. **Client Support**
   - User training
   - Process questions
   - Business requirements

## 💡 Best Practices

### Data Management

1. **Regular Maintenance**
   - Weekly data review
   - Monthly performance analysis
   - Quarterly system optimization

2. **Data Quality**
   - Verify data accuracy
   - Clean duplicate records
   - Validate contact information

3. **Security Practices**
   - Regular password changes
   - Monitor access logs
   - Secure data transmission

### User Experience

1. **Efficient Workflows**
   - Use keyboard shortcuts
   - Save common filters
   - Batch operations

2. **Data Organization**
   - Consistent naming conventions
   - Logical folder structures
   - Regular cleanup

3. **Training & Documentation**
   - User training sessions
   - Process documentation
   - Best practice sharing

### Performance Optimization

1. **System Monitoring**
   - Regular performance checks
   - Resource usage monitoring
   - Proactive maintenance

2. **Optimization Strategies**
   - Database query optimization
   - Caching implementation
   - Code performance tuning

3. **Scalability Planning**
   - Growth projections
   - Resource planning
   - Performance benchmarks

---

## 📞 Support & Contact

### Getting Help

- **Documentation**: Start with this guide and README
- **Self-Service**: Check troubleshooting section
- **Developer Support**: Contact for technical issues
- **Client Support**: Contact for business questions

### Emergency Procedures

1. **System Down**: Check status pages and contact support
2. **Data Issues**: Stop operations and contact support
3. **Security Breach**: Change passwords and contact support immediately

---

_Last updated: August 2025_
_Admin Guide version: 1.0_
_For technical support, contact the development team_
