import { json, readJson, sbSrv, corsHeaders } from '../_shared/utils.ts';

async function scheduleSequence(
  supabase: any,
  lead_id: string,
  locale: string,
  pathway: string,
  needs_checklist: boolean
) {
  const now = Date.now();
  const rows = [
    {
      lead_id,
      step: 0,
      scheduled_at: new Date(now + 5 * 60 * 1000).toISOString(),
      template_key: 'welcome',
      locale,
      pathway,
    },
    {
      lead_id,
      step: 1,
      scheduled_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      template_key: needs_checklist ? 'welcome_checklist' : 'check_in_no_checklist',
      locale,
      pathway,
    },
    {
      lead_id,
      step: 2,
      scheduled_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      template_key: 'nudge',
      locale,
      pathway,
    },
  ];

  const { error } = await supabase.from('email_sequences').insert(rows);
  if (error) {
    console.error('[api-lead-capture] Error scheduling sequences:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = sbSrv();
    const body = await readJson(req);

    const leadPayload = {
      name: body.full_name ?? '',
      email: body.email ?? '',
      phone: body.phone ?? '',
      locale: body.locale ?? 'en',
      pathway: body.pathway ?? null,
      timeline: body.timeline ?? null,
      family_details: body.family_details ?? null,
      country_of_citizenship: body.country_of_citizenship ?? null,
      current_location: body.current_location ?? null,
      needs_checklist: body.needs_checklist ?? false,
      stage: 'new',
    };

    const { data: upserted, error } = await supabase
      .from('leads')
      .upsert(leadPayload, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      console.error('[api-lead-capture] Database error:', error);
      return json({ ok: false, error: error.message }, 500);
    }

    await scheduleSequence(
      supabase,
      upserted.id,
      upserted.locale || 'en',
      upserted.pathway || 'general',
      upserted.needs_checklist === true
    );

    return json({ ok: true, lead_id: upserted.id });
  } catch (error: any) {
    console.error('[api-lead-capture] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
