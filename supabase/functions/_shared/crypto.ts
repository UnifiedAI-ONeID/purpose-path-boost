/**
 * AES-GCM encryption/decryption for secrets
 * Uses KMS_MASTER env var as the master key
 */

export async function enc(plain: string) {
  const keyRaw = Deno.env.get('KMS_MASTER') || Deno.env.get('MASTER_KEY')!;
  const key = await crypto.subtle.importKey(
    'raw',
    b64d(keyRaw),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  return {
    cipher_b64: b64e(new Uint8Array(buf)),
    iv_b64: b64e(iv)
  };
}

export async function dec(cipher_b64: string, iv_b64: string) {
  const keyRaw = Deno.env.get('KMS_MASTER') || Deno.env.get('MASTER_KEY')!;
  const key = await crypto.subtle.importKey(
    'raw',
    b64d(keyRaw),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64d(iv_b64) },
    key,
    b64d(cipher_b64)
  );
  return new TextDecoder().decode(buf);
}

function b64e(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8));
}

function b64d(s: string): Uint8Array {
  return new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)));
}
