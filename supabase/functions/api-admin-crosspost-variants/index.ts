import { json, readJson, corsHeaders } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin } = await requireAdmin(req.headers.get('authorization'));
    if (!isAdmin) {
      return json({ ok: false, error: 'Admin access required' }, 403);
    }

    const { title, summary, locale = 'en' } = await readJson(req);

    // Generate platform-specific variants
    const base = `${title} — ${summary}`.slice(0, 180);
    
    const variants = {
      linkedin: `${base} | #coaching #clarity #growth`,
      facebook: base,
      x: `${title} • ${summary}`.slice(0, 250) + ' #coaching',
      wechat: `${title}\n\n${summary}\n（掃碼查看詳情）`,
      xiaohongshu: `【${title}】\n${summary}\n#成長 #教練 #清晰`,
      instagram: summary.slice(0, 180) + ' 🌟'
    };

    return json({ ok: true, variants, locale });
  } catch (error: any) {
    console.error('[api-admin-crosspost-variants] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
