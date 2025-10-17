/**
 * Webhook signature verification utilities
 */

/**
 * Verify Airwallex webhook signature using HMAC-SHA256
 */
export async function verifyAirwallexSignature(
  req: Request,
  rawBody: string,
  secret: string
): Promise<boolean> {
  const signature = req.headers.get('x-signature') || req.headers.get('x-awx-signature');
  
  if (!signature) {
    console.error('[Webhook Security] No signature header found');
    return false;
  }

  if (!secret) {
    console.error('[Webhook Security] No webhook secret configured');
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const mac = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(rawBody)
    );

    const computed = Array.from(new Uint8Array(mac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = computed === signature.toLowerCase();
    
    if (!isValid) {
      console.error('[Webhook Security] Signature mismatch');
    }
    
    return isValid;
  } catch (error) {
    console.error('[Webhook Security] Signature verification error:', error);
    return false;
  }
}

/**
 * Verify Cal.com webhook signature
 */
export async function verifyCalcomSignature(
  req: Request,
  rawBody: string,
  secret: string
): Promise<boolean> {
  const signature = req.headers.get('x-cal-signature-256');
  
  if (!signature) {
    console.error('[Webhook Security] No Cal.com signature header found');
    return false;
  }

  if (!secret) {
    console.error('[Webhook Security] No Cal.com webhook secret configured');
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const mac = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(rawBody)
    );

    const computed = 'sha256=' + Array.from(new Uint8Array(mac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = computed === signature;
    
    if (!isValid) {
      console.error('[Webhook Security] Cal.com signature mismatch');
    }
    
    return isValid;
  } catch (error) {
    console.error('[Webhook Security] Cal.com signature verification error:', error);
    return false;
  }
}
