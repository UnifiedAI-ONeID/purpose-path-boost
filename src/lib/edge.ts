/**
 * Edge Function caller utility
 * Provides type-safe API calls to Supabase Edge Functions
 */

export async function fx<T = any>(
  name: string,
  method: 'GET' | 'POST' = 'GET',
  payload?: any,
  params?: Record<string, string>
) {
  const qs = params ? ('?' + new URLSearchParams(params)) : '';
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}${qs}`;
  
  const init: RequestInit = {
    method,
    headers: { 'content-type': 'application/json' }
  };
  
  if (method === 'POST' && payload) {
    init.body = JSON.stringify(payload);
  }

  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${name} ${r.status}`);
  
  return r.json() as Promise<T>;
}
