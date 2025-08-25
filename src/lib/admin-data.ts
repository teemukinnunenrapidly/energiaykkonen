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
 * Get essential lead statistics for dashboard
 */
export async function getLeadStats() {
  try {
    const { data, error } = await supabase.from('leads').select(`
        created_at,
        annual_savings
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

    // Basic counts
    const totalLeads = leads.length;
    const todayLeads = leads.filter(lead => new Date(lead.created_at) >= today);
    const thisWeekLeads = leads.filter(
      lead => new Date(lead.created_at) >= thisWeek
    );
    const thisMonthLeads = leads.filter(
      lead => new Date(lead.created_at) >= thisMonth
    );
    const lastMonthLeads = leads.filter(lead => {
      const date = new Date(lead.created_at);
      return date >= lastMonth && date < thisMonth;
    });

    // Financial metrics
    const totalAnnualSavings = leads.reduce(
      (sum, lead) => sum + (lead.annual_savings || 0),
      0
    );
    const averageAnnualSavings =
      totalLeads > 0 ? totalAnnualSavings / totalLeads : 0;

    // Growth trends
    const dailyGrowth =
      todayLeads.length -
      leads.filter(lead => {
        const date = new Date(lead.created_at);
        return date >= yesterday && date < today;
      }).length;
    const weeklyGrowth =
      thisWeekLeads.length -
      leads.filter(lead => {
        const date = new Date(lead.created_at);
        return date >= lastWeek && date < thisWeek;
      }).length;
    const monthlyGrowth = thisMonthLeads.length - lastMonthLeads.length;

    const stats = {
      // Basic counts
      total: totalLeads,
      today: todayLeads.length,
      thisWeek: thisWeekLeads.length,

      // Financial metrics
      averageSavings: averageAnnualSavings,

      // Growth trends
      trends: {
        daily: dailyGrowth,
        weekly: weeklyGrowth,
        monthly: monthlyGrowth,
      },
    };

    return stats;
  } catch (error) {
    console.error('Error in getLeadStats:', error);
    throw error;
  }
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
