import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { dec } from './crypto.ts';

export async function getSecret(key: string): Promise<string | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { fetch } }
  );
  
  const { data } = await supabase
    .from('integration_secrets')
    .select('*')
    .eq('key', key)
    .maybeSingle();
    
  if (!data) return null;
  
  return await dec(data.cipher_b64, data.iv_b64);
}
