import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MASTER_KEY = Deno.env.get('MASTER_KEY')!;
const ADMIN_EMAIL = 'simon.luke@unswalumni.com';

function assert(cond: any, msg = 'Unauthorized') {
  if (!cond) throw new Error(msg);
}

async function aesEncrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyData = base64ToUint8Array(MASTER_KEY);
  const key = await crypto.subtle.importKey(
    'raw', 
    keyData.buffer as ArrayBuffer, 
    'AES-GCM', 
    false, 
    ['encrypt', 'decrypt']
  );
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  return { 
    iv: Array.from(new Uint8Array(iv)), 
    value: Array.from(new Uint8Array(ct)) 
  };
}

async function aesDecrypt(ivArray: number[], ctArray: number[]) {
  const keyData = base64ToUint8Array(MASTER_KEY);
  const key = await crypto.subtle.importKey(
    'raw', 
    keyData.buffer as ArrayBuffer, 
    'AES-GCM', 
    false, 
    ['encrypt', 'decrypt']
  );
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivArray) }, 
    key, 
    new Uint8Array(ctArray)
  );
  return new TextDecoder().decode(pt);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header and create client
    const authHeader = req.headers.get('Authorization');
    assert(authHeader, 'Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Verify user is authenticated and admin
    const { data: { user }, error: userError } = await (supabaseClient.auth as any).getUser();
    console.log('User check:', { user: user?.email, error: userError });
    
    assert(user && !userError, 'Authentication failed');
    assert(
      user!.email === ADMIN_EMAIL || user!.user_metadata?.role === 'admin',
      'Admin access required'
    );

    // Create service role client for database access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const keysParam = url.searchParams.get('keys') || '';
      const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean);
      
      console.log('GET request for keys:', keys);
      
      // If no keys specified, return empty array
      if (keys.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('secrets')
        .select('key, updated_at')
        .in('key', keys);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Return masked values so UI can show presence without exposing secrets
      const payload = (data || []).map(r => ({ 
        key: r.key, 
        exists: true, 
        updated_at: r.updated_at 
      }));

      console.log('Returning payload:', payload);

      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { key, value } = body || {};
      
      console.log('PUT request for key:', key);
      assert(key && typeof value === 'string', 'Invalid payload');

      const enc = await aesEncrypt(value);
      const { data, error } = await supabaseAdmin
        .from('secrets')
        .upsert({ 
          key, 
          value: enc.value, 
          iv: enc.iv, 
          updated_at: new Date().toISOString() 
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Successfully saved secret:', key);

      return new Response(
        JSON.stringify({ ok: true, key, updated_at: data?.[0]?.updated_at }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Error in manage-secrets:', e);
    return new Response(JSON.stringify({ error: e.message || 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
