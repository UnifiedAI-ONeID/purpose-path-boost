import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async (req: VercelRequest, res: VercelResponse) => {
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const device = String(req.query.device || req.headers['x-zg-device'] || '');
  
  if (!device) {
    return res.status(400).json({ ok: false, error: 'device_id required' });
  }

  // Get profile
  const { data: profile } = await s
    .from('zg_profiles')
    .select('*')
    .eq('device_id', device)
    .maybeSingle();

  if (!profile) {
    return res.status(404).json({ ok: false, error: 'profile not found' });
  }

  // Get referral code
  let { data: refData } = await s
    .from('zg_referrals')
    .select('ref_code')
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (!refData) {
    const ref_code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data: newRef } = await s
      .from('zg_referrals')
      .insert({ profile_id: profile.id, ref_code })
      .select()
      .single();
    refData = newRef;
  }

  // Get next session from cal_bookings
  const { data: nextSession } = await s
    .from('cal_bookings')
    .select('*')
    .eq('attendee_email', profile.email || '')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Calculate streak (simplified: count events in last 30 days)
  const { count } = await s
    .from('zg_events')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', device)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const streak_pct = Math.min(100, (count || 0) * 3.33); // ~30 events = 100%

  res.status(200).json({
    ok: true,
    next: nextSession ? {
      start: nextSession.start_time,
      join_url: nextSession.meeting_url
    } : null,
    streak_pct,
    ref_url: `${req.headers.origin || 'https://zhengrowth.com'}?ref=${refData?.ref_code}`,
    profile
  });
};
