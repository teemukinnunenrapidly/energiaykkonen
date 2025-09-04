import { Lead } from '@/lib/supabase';

/**
 * Calculate lead score based on savings potential and other factors
 */
export function calculateLeadScore(lead: Lead): 'high' | 'medium' | 'low' {
  let score = 0;

  // Annual savings weight (40%)
  if (lead.annual_savings >= 2000) {
    score += 40;
  } else if (lead.annual_savings >= 1000) {
    score += 25;
  } else if (lead.annual_savings >= 500) {
    score += 15;
  }

  // House size weight (20%)
  if (lead.neliot >= 150) {
    score += 20;
  } else if (lead.neliot >= 100) {
    score += 15;
  } else if (lead.neliot >= 50) {
    score += 10;
  }

  // Payback period weight (20%)
  if (lead.payback_period <= 8) {
    score += 20;
  } else if (lead.payback_period <= 12) {
    score += 15;
  } else if (lead.payback_period <= 15) {
    score += 10;
  }

  // Current heating type weight (10%)
  if (lead.lammitysmuoto === 'Oil') {
    score += 10;
  } else if (lead.lammitysmuoto === 'Electric') {
    score += 8;
  } else if (lead.lammitysmuoto === 'District') {
    score += 5;
  }

  // Contact preference weight (5%)
  if (
    lead.valittutukimuoto === 'Phone' ||
    lead.valittutukimuoto === 'Both'
  ) {
    score += 5;
  }

  // Additional message indicates higher interest (5%)
  if (lead.message && lead.message.trim().length > 0) {
    score += 5;
  }

  // Determine final score
  if (score >= 70) {
    return 'high';
  }
  if (score >= 40) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate email subject lines
 */
export const emailSubjects = {
  customer: () => `Your Heat Pump Savings Calculation - Energiaykkönen`,

  sales: (lead: Lead) =>
    `New Lead: ${lead.first_name} ${lead.last_name} - ${lead.paikkakunta || 'Ei kaupunkia'} - Savings: ${lead.annual_savings.toLocaleString('fi-FI')}€/year`,
};

/**
 * Get admin URL for CRM integration
 */
export function getAdminUrl(
  leadId: string,
  baseUrl: string = 'https://laskuri.energiaykkonen.fi'
): string {
  return `${baseUrl}/admin?lead=${leadId}`;
}

/**
 * Format currency for Finnish locale
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fi-FI');
}

/**
 * Format date for Finnish locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fi-FI');
}
