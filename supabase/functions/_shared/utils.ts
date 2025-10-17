import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

/**
 * Shared utilities for Edge Functions
 */

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    }
  });
}

export async function readJson<T = any>(req: Request): Promise<T> {
  try {
    return await req.json() as T;
  } catch {
    return {} as T;
  }
}

export function bad(msg = 'Bad Request', status = 400) {
  return json({ ok: false, error: msg }, status);
}

export function qs(req: Request) {
  return new URL(req.url).searchParams;
}

export function sbAnon(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { fetch } }
  );
}

export function sbSrv() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { fetch } }
  );
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
