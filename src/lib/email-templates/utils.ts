import { Lead } from '@/lib/supabase';
import { flattenLeadData, getLeadValue } from '@/lib/lead-helpers';

/**
 * Calculate lead score based on savings potential and other factors
 */
export function calculateLeadScore(lead: Lead): 'high' | 'medium' | 'low' {
  // Flatten lead data to access JSONB fields
  const flatLead = flattenLeadData(lead) as any;
  let score = 0;

  // Annual savings weight (40%)
  const annualSavings = flatLead.annual_savings || 0;
  if (annualSavings >= 2000) {
    score += 40;
  } else if (annualSavings >= 1000) {
    score += 25;
  } else if (annualSavings >= 500) {
    score += 15;
  }

  // House size weight (20%)
  const neliot = flatLead.neliot || 0;
  if (neliot >= 150) {
    score += 20;
  } else if (neliot >= 100) {
    score += 15;
  } else if (neliot >= 50) {
    score += 10;
  }

  // Payback period weight (20%)
  const paybackPeriod = flatLead.payback_period || 0;
  if (paybackPeriod <= 8 && paybackPeriod > 0) {
    score += 20;
  } else if (paybackPeriod <= 12) {
    score += 15;
  } else if (paybackPeriod <= 15) {
    score += 10;
  }

  // Current heating type weight (10%)
  const lammitysmuoto = flatLead.lammitysmuoto;
  if (lammitysmuoto === 'Oil') {
    score += 10;
  } else if (lammitysmuoto === 'Electric') {
    score += 8;
  } else if (lammitysmuoto === 'District') {
    score += 5;
  }

  // Contact preference weight (5%)
  const valittutukimuoto = flatLead.valittutukimuoto;
  if (valittutukimuoto === 'Phone' || valittutukimuoto === 'Both') {
    score += 5;
  }

  // Additional message indicates higher interest (5%)
  const message = flatLead.message;
  if (message && message.trim().length > 0) {
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
  customer: () => `Säästölaskurin tulokset - Energiaykkönen`,

  sales: (lead: Lead) => {
    const flatLead = flattenLeadData(lead) as any;
    return `New Lead: ${flatLead.nimi} - ${flatLead.paikkakunta || 'Ei kaupunkia'} - Savings: ${flatLead.annual_savings?.toLocaleString('fi-FI') || '0'}€/year`;
  },
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
