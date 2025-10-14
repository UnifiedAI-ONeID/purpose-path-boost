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
    const { amount, currency, description, customerEmail, customerName, metadata } = req.body;

    // Validate required fields
    if (!amount || !currency || !customerEmail || !customerName) {
      return res.status(400).json({
        error: 'Missing required fields: amount, currency, customerEmail, customerName',
      });
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
          first_name: customerName.split(' ')[0],
          last_name: customerName.split(' ').slice(1).join(' ') || customerName,
        },
        reference_id: `ref_${Date.now()}`,
        description,
        metadata,
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
    console.error('Payment link creation error:', error);
    return res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message,
    });
  }
}
