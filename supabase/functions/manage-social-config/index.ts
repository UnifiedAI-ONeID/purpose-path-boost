import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM encryption/decryption using Web Crypto API
async function getKey(): Promise<CryptoKey> {
  const masterKeyB64 = Deno.env.get('SECRET_MASTER_KEY');
  if (!masterKeyB64) {
    throw new Error('SECRET_MASTER_KEY not configured');
  }
  
  const keyData = Uint8Array.from(atob(masterKeyB64), c => c.charCodeAt(0));
  if (keyData.length !== 32) {
    throw new Error('SECRET_MASTER_KEY must be 32 bytes (base64 encoded)');
  }
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine: iv (12 bytes) + ciphertext (with auth tag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptSecret(encrypted: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Mask secrets for safe transmission
function maskSecret(value?: string): string {
  return value ? '••••••••' : '';
}

// Test connection to a platform
async function testConnection(platform: string, secrets: any): Promise<boolean> {
  try {
    console.log(`Testing connection for ${platform}`);
    
    if (platform === 'twitter') {
      // For Twitter, we'll use the webhook approach if configured
      if (secrets.webhookUrl) {
        const response = await fetch(secrets.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            test: true, 
            platform: 'twitter',
            timestamp: new Date().toISOString()
          })
        });
        return response.ok;
      }
      return false;
    }
    
    // Add other platform tests as needed
    return true;
  } catch (error) {
    console.error(`Connection test failed for ${platform}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin access
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: adminRow, error: adminErr } = await supabaseClient
      .from('zg_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminErr) {
      console.error('[manage-social-config] Admin query error:', adminErr);
    }

    if (!adminRow) {
      throw new Error('Admin access required');
    }

    const { method } = req;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // GET - List all configs (masked)
    if (method === 'GET' && action === 'manage-social-config') {
      const { data: configs, error } = await supabaseClient
        .from('social_configs')
        .select('*')
        .order('platform');

      if (error) throw error;

      const masked = configs.map(config => ({
        id: config.id,
        platform: config.platform,
        enabled: config.enabled,
        posting_template: config.posting_template,
        last_test_status: config.last_test_status,
        last_test_at: config.last_test_at,
        version: config.version,
        updated_at: config.updated_at,
        // Mask all secrets
        app_key: maskSecret(config.app_key_enc),
        app_secret: maskSecret(config.app_secret_enc),
        access_token: maskSecret(config.access_token_enc),
        refresh_token: maskSecret(config.refresh_token_enc),
        account_id: maskSecret(config.account_id_enc),
        webhook_url: maskSecret(config.webhook_url_enc),
      }));

      return new Response(JSON.stringify(masked), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Update config
    if (method === 'POST' && action !== 'test') {
      const body = await req.json();
      const { platform, enabled, posting_template, ...secretFields } = body;

      // Get current config
      const { data: current, error: currentErr } = await supabaseClient
        .from('social_configs')
        .select('*')
        .eq('platform', platform)
        .maybeSingle();

      if (currentErr) {
        console.error('[manage-social-config] Load current config error:', currentErr);
      }

      // Process secret fields
      const applySecret = async (currentEnc?: string, incoming?: string) => {
        if (incoming === undefined) return currentEnc;
        if (incoming === '__CLEAR__') return null;
        if (!incoming || incoming === '••••••••') return currentEnc;
        return await encryptSecret(incoming);
      };

      const updated = {
        enabled,
        posting_template: posting_template || null,
        app_key_enc: await applySecret(current?.app_key_enc, secretFields.app_key),
        app_secret_enc: await applySecret(current?.app_secret_enc, secretFields.app_secret),
        access_token_enc: await applySecret(current?.access_token_enc, secretFields.access_token),
        refresh_token_enc: await applySecret(current?.refresh_token_enc, secretFields.refresh_token),
        account_id_enc: await applySecret(current?.account_id_enc, secretFields.account_id),
        webhook_url_enc: await applySecret(current?.webhook_url_enc, secretFields.webhook_url),
        updated_by: user.id,
      };

      const { data, error } = await supabaseClient
        .from('social_configs')
        .update(updated)
        .eq('platform', platform)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Log the change
      await supabaseClient
        .from('social_config_logs')
        .insert({
          platform,
          action: 'update',
          version: data.version,
          changed_by: user.id,
          changes: { enabled, hasSecrets: !!secretFields.app_key },
        });

      return new Response(JSON.stringify({ 
        ok: true, 
        version: data.version,
        updated_at: data.updated_at 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Test connection
    if (method === 'POST' && action === 'test') {
      const { platform } = await req.json();

      const { data: config, error: cfgErr } = await supabaseClient
        .from('social_configs')
        .select('*')
        .eq('platform', platform)
        .maybeSingle();

      if (cfgErr) {
        console.error('[manage-social-config] Load config error:', cfgErr);
      }

      if (!config) {
        throw new Error('Platform not configured');
      }

      // Decrypt secrets for testing
      const secrets = {
        appKey: config.app_key_enc ? await decryptSecret(config.app_key_enc) : undefined,
        appSecret: config.app_secret_enc ? await decryptSecret(config.app_secret_enc) : undefined,
        accessToken: config.access_token_enc ? await decryptSecret(config.access_token_enc) : undefined,
        refreshToken: config.refresh_token_enc ? await decryptSecret(config.refresh_token_enc) : undefined,
        accountId: config.account_id_enc ? await decryptSecret(config.account_id_enc) : undefined,
        webhookUrl: config.webhook_url_enc ? await decryptSecret(config.webhook_url_enc) : undefined,
      };

      const ok = await testConnection(platform, secrets);

      // Update test status
      await supabaseClient
        .from('social_configs')
        .update({
          last_test_status: ok ? 'ok' : 'fail',
          last_test_at: new Date().toISOString(),
        })
        .eq('platform', platform);

      return new Response(JSON.stringify({ ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid request');

  } catch (error: any) {
    console.error('Error in manage-social-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes('Unauthorized') || error.message.includes('Admin') ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
