import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    const { isAdmin, user } = await requireAdmin(authHeader);
    
    if (!isAdmin || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized: Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[api-admin-leads-export] Query error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch leads' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert to CSV
    const headers = [
      'ID', 'Name', 'Email', 'Language', 'WeChat', 'Clarity Score', 'Quiz Score',
      'Stage', 'Source', 'Country', 'Booking Goal', 'Booking Challenge', 
      'Booking Timeline', 'Tags', 'Notes', 'Created At'
    ];

    const csvRows = [headers.join(',')];

    for (const lead of leads || []) {
      const row = [
        lead.id,
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        lead.email,
        lead.language || '',
        lead.wechat || '',
        lead.clarity_score || '',
        lead.quiz_score || '',
        lead.stage || '',
        lead.source || '',
        lead.country || '',
        `"${(lead.booking_goal || '').replace(/"/g, '""')}"`,
        `"${(lead.booking_challenge || '').replace(/"/g, '""')}"`,
        lead.booking_timeline || '',
        `"${(lead.tags || []).join(', ')}"`,
        `"${(lead.notes || '').replace(/"/g, '""')}"`,
        new Date(lead.created_at).toISOString()
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;

    console.log('[api-admin-leads-export] Exported', leads?.length, 'leads');

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('[api-admin-leads-export] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
