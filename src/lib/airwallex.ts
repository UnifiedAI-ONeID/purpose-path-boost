// Airwallex Payment Integration

export interface PaymentLinkRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, string>;
}

export interface PaymentLinkResponse {
  url: string;
  id: string;
}

export const createPaymentLink = async (
  data: PaymentLinkRequest
): Promise<PaymentLinkResponse> => {
  try {
    const response = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment link');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment link creation error:', error);
    throw error;
  }
};

export const COACHING_PACKAGES = {
  discovery: {
    id: 'discovery',
    name: 'Discovery Session',
    price: 0,
    currency: 'USD',
    description: 'Free 30-minute clarity call',
    duration: '30 minutes',
    features: [
      'Understand your current challenges',
      'Explore coaching fit',
      'Create initial action plan',
    ],
  },
  single: {
    id: 'single',
    name: 'Single Session',
    price: 200,
    currency: 'USD',
    description: 'One-on-one intensive coaching',
    duration: '60 minutes',
    features: [
      'Deep-dive on specific challenge',
      'Customized strategies',
      'Action plan with accountability',
      'Email follow-up support',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Package',
    price: 700,
    currency: 'USD',
    description: '4 sessions + ongoing support',
    duration: '4 × 60 minutes',
    features: [
      '4 weekly coaching sessions',
      'Unlimited email support',
      'Custom resources and tools',
      'Progress tracking dashboard',
      'Priority scheduling',
    ],
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Intensive',
    price: 1900,
    currency: 'USD',
    description: '12 sessions + VIP support',
    duration: '3 months',
    features: [
      '12 weekly coaching sessions',
      'Unlimited messaging support',
      'Custom goal-setting framework',
      'Monthly progress reviews',
      'Exclusive resources library',
      'Priority access to workshops',
    ],
  },
} as const;

export type CoachingPackageId = keyof typeof COACHING_PACKAGES;
