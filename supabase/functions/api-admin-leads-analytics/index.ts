import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

interface AnalyticsRequest {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    const { isAdmin, user } = await requireAdmin(authHeader);
    
    if (!isAdmin || !user) {
      return jsonResponse({ 
        ok: false, 
        error: 'Unauthorized: Admin access required' 
      }, 403);
    }

    const params: AnalyticsRequest = req.method === 'POST' 
      ? await req.json()
      : Object.fromEntries(new URL(req.url).searchParams);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Default to last 30 days
    const dateTo = params.dateTo || new Date().toISOString();
    const dateFrom = params.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all leads in date range
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    if (leadsError) {
      console.error('[api-admin-leads-analytics] Leads query error:', leadsError);
      return jsonResponse({ ok: false, error: 'Failed to fetch leads' }, 500);
    }

    // Calculate metrics
    const totalLeads = leads?.length || 0;
    const stageBreakdown = leads?.reduce((acc, lead) => {
      const stage = lead.stage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceBreakdown = leads?.reduce((acc, lead) => {
      const source = lead.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const languageBreakdown = leads?.reduce((acc, lead) => {
      const language = lead.language || 'unknown';
      acc[language] = (acc[language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryBreakdown = leads?.reduce((acc, lead) => {
      const country = lead.country || 'unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average scores
    const leadsWithClarityScore = leads?.filter(l => l.clarity_score != null) || [];
    const avgClarityScore = leadsWithClarityScore.length > 0
      ? leadsWithClarityScore.reduce((sum, l) => sum + (l.clarity_score || 0), 0) / leadsWithClarityScore.length
      : 0;

    const leadsWithQuizScore = leads?.filter(l => l.quiz_score != null) || [];
    const avgQuizScore = leadsWithQuizScore.length > 0
      ? leadsWithQuizScore.reduce((sum, l) => sum + (l.quiz_score || 0), 0) / leadsWithQuizScore.length
      : 0;

    // Group by time period
    const groupBy = params.groupBy || 'day';
    const timeGrouped = leads?.reduce((acc, lead) => {
      const date = new Date(lead.created_at);
      let key: string;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else { // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!acc[key]) {
        acc[key] = { count: 0, stages: {}, sources: {} };
      }
      acc[key].count++;
      
      const stage = lead.stage || 'unknown';
      acc[key].stages[stage] = (acc[key].stages[stage] || 0) + 1;
      
      const source = lead.source || 'unknown';
      acc[key].sources[source] = (acc[key].sources[source] || 0) + 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate conversion rates
    const wonLeads = leads?.filter(l => l.stage === 'won').length || 0;
    const lostLeads = leads?.filter(l => l.stage === 'lost').length || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayLeads = leads?.filter(l => 
      l.created_at.startsWith(today)
    ).length || 0;

    // Calculate week-over-week growth
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const previousWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeekLeads = leads?.filter(l => 
      new Date(l.created_at) >= lastWeek
    ).length || 0;
    
    const previousWeekLeads = leads?.filter(l => 
      new Date(l.created_at) >= previousWeek && new Date(l.created_at) < lastWeek
    ).length || 0;

    const weekOverWeekGrowth = previousWeekLeads > 0
      ? ((lastWeekLeads - previousWeekLeads) / previousWeekLeads) * 100
      : 0;

    return jsonResponse({
      ok: true,
      analytics: {
        summary: {
          totalLeads,
          todayLeads,
          wonLeads,
          lostLeads,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          weekOverWeekGrowth: parseFloat(weekOverWeekGrowth.toFixed(2)),
          avgClarityScore: parseFloat(avgClarityScore.toFixed(2)),
          avgQuizScore: parseFloat(avgQuizScore.toFixed(2))
        },
        breakdown: {
          byStage: stageBreakdown,
          bySource: sourceBreakdown,
          byLanguage: languageBreakdown,
          byCountry: countryBreakdown
        },
        timeSeries: timeGrouped
      },
      dateRange: {
        from: dateFrom,
        to: dateTo
      }
    }, 200);

  } catch (error) {
    console.error('[api-admin-leads-analytics] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
