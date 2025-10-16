import { createClient } from '@supabase/supabase-js';

let CACHED_KEY: { v: string; t: number } | null = null;

export async function getCalKey() {
  const now = Date.now();
  // Return cached key if less than 5 minutes old
  if (CACHED_KEY && now - CACHED_KEY.t < 5 * 60 * 1000) {
    return CACHED_KEY.v;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from('secure_kv')
    .select('value')
    .eq('key', 'calcom_api_key')
    .single();

  if (error || !data?.value) {
    throw new Error('Cal.com API key not configured in secure_kv table');
  }

  CACHED_KEY = { v: data.value, t: now };
  return data.value;
}
