import { supabase, Lead } from '@/lib/supabase';
import { flattenLeadsData, flattenLeadData } from '@/lib/lead-helpers';

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
 * Now works with JSONB structure
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
    // Build query - fetch all data including form_data JSONB
    let countQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('leads').select('*');

    // Apply search filter (using fixed columns only)
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      // Search in fixed columns only (first_name, last_name, sahkoposti)
      const searchFilter = `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},sahkoposti.ilike.${searchTerm}`;
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

    // Get all data first, then filter by savings if needed
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Error counting leads: ${countError.message}`);
    }

    let totalCount = count || 0;

    // Get all matching leads first
    const { data: allLeads, error: allError } = await dataQuery.order(sortBy, {
      ascending: sortOrder === 'asc',
    });

    if (allError) {
      throw new Error(`Error fetching leads: ${allError.message}`);
    }

    // Flatten the leads to access JSONB fields
    let processedLeads = flattenLeadsData(allLeads || []);

    // Apply savings filter on flattened data
    if (savingsMin !== undefined && savingsMin >= 0) {
      processedLeads = processedLeads.filter(
        lead => (lead.annual_savings || 0) >= savingsMin
      );
    }
    if (savingsMax !== undefined && savingsMax >= 0) {
      processedLeads = processedLeads.filter(
        lead => (lead.annual_savings || 0) <= savingsMax
      );
    }

    // Update total count after filtering
    totalCount = processedLeads.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedLeads = processedLeads.slice(from, to);

    return {
      leads: paginatedLeads,
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
 * Now works with JSONB structure
 */
export async function getLeadStats() {
  try {
    // Fetch all leads with their form_data
    const { data, error } = await supabase.from('leads').select('*');

    if (error) {
      throw new Error(`Error fetching lead stats: ${error.message}`);
    }

    // Flatten the leads to access JSONB fields
    const leads = flattenLeadsData(data || []);
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

    // Financial metrics - now using flattened data
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

    // Return flattened lead
    return flattenLeadData(data);
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

    // Return flattened lead
    return flattenLeadData(data);
  } catch (error) {
    console.error('Error in updateLeadNotes:', error);
    throw error;
  }
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(leadId: string): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Error fetching lead: ${error.message}`);
    }

    // Return flattened lead
    return flattenLeadData(data);
  } catch (error) {
    console.error('Error in getLeadById:', error);
    throw error;
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(leadId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);

    if (error) {
      throw new Error(`Error deleting lead: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteLead:', error);
    throw error;
  }
}

/**
 * Get leads summary for export
 */
export async function getLeadsForExport(filters: GetLeadsOptions = {}) {
  try {
    // Get all leads with current filters (no pagination)
    const allLeadsResponse = await getLeadsWithPagination({
      ...filters,
      page: 1,
      limit: 10000, // Get all records
    });

    return allLeadsResponse.leads;
  } catch (error) {
    console.error('Error in getLeadsForExport:', error);
    throw error;
  }
}
