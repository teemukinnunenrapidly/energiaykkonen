// Email template exports for Resend integration
export {
  CustomerResultsTemplate,
  generateCustomerEmailHtml,
} from './customer-results';

export {
  SalesNotificationTemplate,
  generateSalesEmailHtml,
} from './sales-notification';

export {
  calculateLeadScore,
  emailSubjects,
  getAdminUrl,
  formatCurrency,
  formatDate,
} from './utils';

// Type definitions for email data
export interface CustomerEmailData {
  firstName: string;
  lastName: string;
  calculations: {
    annualSavings: number;
    fiveYearSavings: number;
    tenYearSavings: number;
    paybackPeriod: number;
    co2Reduction: number;
  };
  houseInfo: {
    squareMeters: number;
    heatingType: string;
  };
}

export interface SalesEmailData {
  lead: import('@/lib/supabase').Lead;
  leadScore: 'high' | 'medium' | 'low';
  adminUrl: string;
}
