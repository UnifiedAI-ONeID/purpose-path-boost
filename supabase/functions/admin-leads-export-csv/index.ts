import { corsHeaders } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { sbSrv } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);
    
    if (!isAdmin) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = sbSrv();

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate CSV
    const headers = ['id', 'email', 'name', 'language', 'source', 'stage', 'country', 'created_at'];
    const csvRows = [headers.join(',')];

    for (const lead of data || []) {
      const row = headers.map(h => {
        const val = lead[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val || '';
      });
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leads.csv"'
      }
    });
  } catch (error) {
    console.error('[admin-leads-export-csv] Error:', error);
    return new Response('Internal error', { status: 500 });
  }
});
