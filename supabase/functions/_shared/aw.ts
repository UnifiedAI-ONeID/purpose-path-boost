/**
 * Airwallex API helper with automatic token management
 */

let _tok: { val: string; exp: number } | null = null;

export async function awToken() {
  if (_tok && Date.now() < _tok.exp) return _tok.val;
  
  const r = await fetch(`${Deno.env.get('AIRWALLEX_API_BASE')}/api/v1/authentication/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('AIRWALLEX_CLIENT_ID'),
      api_key: Deno.env.get('AIRWALLEX_API_KEY')
    })
  });
  
  const j = await r.json();
  _tok = { val: j.token, exp: Date.now() + (j.expires_in * 1000 - 30000) };
  return _tok.val;
}

export async function aw(path: string, init: RequestInit = {}) {
  const t = await awToken();
  return fetch(`${Deno.env.get('AIRWALLEX_API_BASE')}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${t}`
    }
  });
}
