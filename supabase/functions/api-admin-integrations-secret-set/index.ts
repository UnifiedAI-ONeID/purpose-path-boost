import { json, readJson, sbSrv, bad } from '../_shared/utils.ts';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';
import { enc } from '../_shared/crypto.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SecretSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(255, 'Key must be less than 255 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be UPPERCASE_SNAKE_CASE'),
  value: z.string()
    .min(1, 'Value is required')
    .max(10000, 'Value must be less than 10000 characters')
});

const RESERVED_KEYS = ['KMS_MASTER', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  const authHeader = req.headers.get('authorization');
  const { isAdmin } = await requireAdmin(authHeader);
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  try {
    const body = await readJson(req);
    const validated = SecretSchema.parse(body);
    
    // Prevent overwriting system secrets
    if (RESERVED_KEYS.includes(validated.key)) {
      return bad('Cannot modify system secrets');
    }

    const supabase = sbSrv();
    const { cipher_b64, iv_b64 } = await enc(validated.value);
    
    await supabase
      .from('integration_secrets')
      .upsert({
        key: validated.key,
        cipher_b64,
        iv_b64,
        updated_at: new Date().toISOString()
      });

    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return bad(firstError.message);
    }
    console.error('[Secret Set] Error:', error);
    return bad('Failed to store secret');
  }
});
