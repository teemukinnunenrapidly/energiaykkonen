import { supabase, Lead } from '@/lib/supabase';

export interface LeadsResponse {
  leads: Lead[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface GetLeadsOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  savingsMin?: number;
  savingsMax?: number;
}

/**
 * Fetch leads with pagination for admin panel
 */
export async function getLeadsWithPagination(
  options: GetLeadsOptions = {}
): Promise<LeadsResponse> {
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
    search = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    savingsMin,
    savingsMax,
  } = options;

  try {
    // Build query with filters
    let countQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('leads').select('*');

    // Apply search filter (name, email, city)
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const searchFilter = `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},city.ilike.${searchTerm}`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Apply status filter
    if (status) {
      countQuery = countQuery.eq('status', status);
      dataQuery = dataQuery.eq('status', status);
    }

    // Apply date range filter
    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom);
      dataQuery = dataQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      // Add time to include the whole day
      const dateToWithTime = new Date(dateTo);
      dateToWithTime.setHours(23, 59, 59, 999);
      countQuery = countQuery.lte('created_at', dateToWithTime.toISOString());
      dataQuery = dataQuery.lte('created_at', dateToWithTime.toISOString());
    }

    // Apply savings range filter
    if (savingsMin !== undefined && savingsMin >= 0) {
      countQuery = countQuery.gte('annual_savings', savingsMin);
      dataQuery = dataQuery.gte('annual_savings', savingsMin);
    }
    if (savingsMax !== undefined && savingsMax >= 0) {
      countQuery = countQuery.lte('annual_savings', savingsMax);
      dataQuery = dataQuery.lte('annual_savings', savingsMax);
    }

    // Get filtered count
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Error counting leads: ${countError.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated and filtered leads
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: leads, error: dataError } = await dataQuery
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (dataError) {
      throw new Error(`Error fetching leads: ${dataError.message}`);
    }

    return {
      leads: leads || [],
      totalCount,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    console.error('Error in getLeadsWithPagination:', error);
    throw error;
  }
}

/**
 * Get comprehensive lead statistics for dashboard
 */
export async function getLeadStats() {
  try {
    const { data, error } = await supabase.from('leads').select(`
        status,
        created_at,
        annual_savings,
        five_year_savings,
        ten_year_savings,
        heating_type,
        city,
        source_page,
        contact_preference,
        square_meters,
        payback_period
      `);

    if (error) {
      throw new Error(`Error fetching lead stats: ${error.message}`);
    }

    const leads = data || [];
    const now = new Date();

    // Time periods
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(
      today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
    );
    const lastWeek = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Basic counts
    const totalLeads = leads.length;
    const todayLeads = leads.filter(lead => new Date(lead.created_at) >= today);
    const yesterdayLeads = leads.filter(lead => {
      const date = new Date(lead.created_at);
      return date >= yesterday && date < today;
    });
    const thisWeekLeads = leads.filter(
      lead => new Date(lead.created_at) >= thisWeek
    );
    const lastWeekLeads = leads.filter(lead => {
      const date = new Date(lead.created_at);
      return date >= lastWeek && date < thisWeek;
    });
    const thisMonthLeads = leads.filter(
      lead => new Date(lead.created_at) >= thisMonth
    );
    const lastMonthLeads = leads.filter(lead => {
      const date = new Date(lead.created_at);
      return date >= lastMonth && date < thisMonth;
    });

    // Status distribution
    const byStatus = {
      new: leads.filter(lead => lead.status === 'new').length,
      contacted: leads.filter(lead => lead.status === 'contacted').length,
      qualified: leads.filter(lead => lead.status === 'qualified').length,
      converted: leads.filter(lead => lead.status === 'converted').length,
    };

    // Conversion rates
    const conversionRate =
      totalLeads > 0 ? (byStatus.converted / totalLeads) * 100 : 0;
    const qualificationRate =
      totalLeads > 0
        ? ((byStatus.qualified + byStatus.converted) / totalLeads) * 100
        : 0;

    // Financial metrics
    const totalAnnualSavings = leads.reduce(
      (sum, lead) => sum + (lead.annual_savings || 0),
      0
    );
    const totalFiveYearSavings = leads.reduce(
      (sum, lead) => sum + (lead.five_year_savings || 0),
      0
    );
    const averageAnnualSavings =
      totalLeads > 0 ? totalAnnualSavings / totalLeads : 0;
    const medianSavings = calculateMedian(
      leads.map(lead => lead.annual_savings || 0)
    );

    // Heating type distribution
    const heatingTypes = leads.reduce(
      (acc, lead) => {
        const type = lead.heating_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Geographic distribution (top 10 cities)
    const cities = leads.reduce(
      (acc, lead) => {
        const city = lead.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topCities = Object.entries(cities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // Source page analysis
    const sources = leads.reduce(
      (acc, lead) => {
        const source = lead.source_page || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Contact preferences
    const contactPreferences = leads.reduce(
      (acc, lead) => {
        const pref = lead.contact_preference || 'Unknown';
        acc[pref] = (acc[pref] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Property size analysis
    const propertySizes = leads
      .filter(lead => lead.square_meters)
      .map(lead => lead.square_meters!);
    const averagePropertySize =
      propertySizes.length > 0
        ? propertySizes.reduce((sum, size) => sum + size, 0) /
          propertySizes.length
        : 0;

    // Payback period analysis
    const paybackPeriods = leads
      .filter(lead => lead.payback_period)
      .map(lead => lead.payback_period!);
    const averagePaybackPeriod =
      paybackPeriods.length > 0
        ? paybackPeriods.reduce((sum, period) => sum + period, 0) /
          paybackPeriods.length
        : 0;

    // Growth trends
    const dailyGrowth = todayLeads.length - yesterdayLeads.length;
    const weeklyGrowth = thisWeekLeads.length - lastWeekLeads.length;
    const monthlyGrowth = thisMonthLeads.length - lastMonthLeads.length;

    // Quality metrics
    const highValueLeads = leads.filter(
      lead => (lead.annual_savings || 0) > averageAnnualSavings
    ).length;
    const quickPaybackLeads = leads.filter(
      lead => (lead.payback_period || 100) <= 5
    ).length;

    const stats = {
      // Basic counts
      total: totalLeads,
      today: todayLeads.length,
      yesterday: yesterdayLeads.length,
      thisWeek: thisWeekLeads.length,
      lastWeek: lastWeekLeads.length,
      thisMonth: thisMonthLeads.length,
      lastMonth: lastMonthLeads.length,

      // Status distribution
      byStatus,

      // Conversion metrics
      conversionRate,
      qualificationRate,

      // Financial metrics
      totalSavings: totalAnnualSavings,
      totalFiveYearSavings,
      averageSavings: averageAnnualSavings,
      medianSavings,

      // Property metrics
      averagePropertySize,
      averagePaybackPeriod,

      // Quality metrics
      highValueLeads,
      quickPaybackLeads,

      // Growth trends
      trends: {
        daily: dailyGrowth,
        weekly: weeklyGrowth,
        monthly: monthlyGrowth,
      },

      // Distributions
      heatingTypes,
      topCities,
      sources,
      contactPreferences,
    };

    return stats;
  } catch (error) {
    console.error('Error in getLeadStats:', error);
    throw error;
  }
}

/**
 * Calculate median value from array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

/**
 * Update lead status
 */
export async function updateLeadStatus(leadId: string, status: Lead['status']) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating lead status: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateLeadStatus:', error);
    throw error;
  }
}

/**
 * Add notes to a lead
 */
export async function updateLeadNotes(leadId: string, notes: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating lead notes: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateLeadNotes:', error);
    throw error;
  }
}
