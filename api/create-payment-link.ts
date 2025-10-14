/**
 * Airwallex Payment Link Creation API
 * 
 * This endpoint creates a payment link using Airwallex Payment Links API.
 * 
 * To use in production:
 * 1. Sign up at https://www.airwallex.com
 * 2. Get API credentials from dashboard
 * 3. Set environment variables: AIRWALLEX_API_KEY and AIRWALLEX_CLIENT_ID
 * 
 * For development, it returns a mock payment URL.
 */

import { z } from 'zod';

// Validation schema
const VALID_CURRENCIES = ['USD', 'CNY', 'HKD', 'EUR', 'GBP'] as const;
const PACKAGE_IDS = ['discovery', 'single', 'monthly', 'quarterly'] as const;

const PaymentRequestSchema = z.object({
  packageId: z.enum(PACKAGE_IDS),
  customerEmail: z.string().email().max(255),
  customerName: z.string().trim().min(2).max(100),
  currency: z.enum(VALID_CURRENCIES),
  metadata: z.record(z.string()).optional()
});

// Package pricing (server-side source of truth)
const PACKAGE_PRICING: Record<string, { price: number; description: string }> = {
  discovery: { price: 0, description: 'Free Discovery Session' },
  single: { price: 200, description: 'Single Coaching Session' },
  monthly: { price: 800, description: 'Monthly Coaching Package (4 sessions)' },
  quarterly: { price: 2100, description: 'Quarterly Coaching Package (12 sessions)' }
};

// Rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Sanitize name
function sanitizeName(name: string): { first: string; last: string } {
  const cleaned = name.trim().replace(/[^a-zA-Z\s'-]/g, '');
  const parts = cleaned.split(/\s+/);
  return {
    first: parts[0] || 'Customer',
    last: parts.slice(1).join(' ') || parts[0]
  };
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIp = (req.headers['x-forwarded-for'] as string) || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Validate input
    const validated = PaymentRequestSchema.parse(req.body);
    const { packageId, customerEmail, customerName, currency, metadata } = validated;

    // Get server-side pricing (never trust client)
    const pkg = PACKAGE_PRICING[packageId];
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const amount = pkg.price;
    const description = pkg.description;

    // Validate amount bounds
    if (amount < 0 || amount > 10000) {
      return res.status(400).json({ error: 'Invalid amount range' });
    }

    // Check if API credentials are configured
    const apiKey = process.env.AIRWALLEX_API_KEY;
    const clientId = process.env.AIRWALLEX_CLIENT_ID;

    // If no credentials, return mock URL for development
    if (!apiKey || !clientId || apiKey === 'xxxxx') {
      console.log('[DEV MODE] Airwallex not configured, returning mock payment URL');
      return res.status(200).json({
        id: 'mock_payment_link_' + Date.now(),
        url: `https://checkout.airwallex.com/drop-in.html?mock=true&amount=${amount}&currency=${currency}`,
        message: 'Development mode: Configure AIRWALLEX_API_KEY to use real payments',
      });
    }

    // Sanitize customer name
    const { first, last } = sanitizeName(customerName);

    // Production: Call Airwallex API
    // First, get access token
    const authResponse = await fetch('https://api.airwallex.com/api/v1/authentication/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey,
      },
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Airwallex');
    }

    const { token } = await authResponse.json();

    // Create payment link
    const paymentLinkResponse = await fetch('https://api.airwallex.com/api/v1/pa/payment_links/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        merchant_order_id: `order_${Date.now()}`,
        customer: {
          email: customerEmail,
          first_name: first,
          last_name: last,
        },
        reference_id: `ref_${Date.now()}`,
        description,
        metadata: {
          ...metadata,
          packageId
        },
        return_url: `${process.env.VITE_SITE_URL || 'https://zhengrowth.com'}/thank-you?payment=success`,
      }),
    });

    if (!paymentLinkResponse.ok) {
      const error = await paymentLinkResponse.json();
      throw new Error(error.message || 'Failed to create payment link');
    }

    const paymentLink = await paymentLinkResponse.json();

    return res.status(200).json({
      id: paymentLink.id,
      url: paymentLink.url,
    });
  } catch (error: any) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: error.errors
      });
    }

    console.error('Payment link creation error:', error.message || 'Unknown error');
    return res.status(500).json({
      error: 'Failed to create payment link'
    });
  }
}
