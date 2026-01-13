// Airwallex Payment Integration
import { db } from '@/firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { invokeApi } from '@/lib/api-client';

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

interface ApiResponse {
  ok: boolean;
  url?: string;
  id?: string;
  error?: string;
}

// Coaching package interface matching Firestore schema
export interface CoachingPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  duration: string;
  features: string[];
  isActive?: boolean;
  calLink?: string;
  eventType?: string;
}

export type CoachingPackageId = string;

// Cache for coaching packages
let packagesCache: Record<string, CoachingPackage> | null = null;
let packagesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch coaching packages from Firestore
 */
export const fetchCoachingPackages = async (): Promise<Record<string, CoachingPackage>> => {
  // Return cached data if valid
  if (packagesCache && Date.now() - packagesCacheTime < CACHE_DURATION) {
    return packagesCache;
  }

  try {
    const q = query(
      collection(db, 'coaching_offers'),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const packages: Record<string, CoachingPackage> = {};
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const id = data.slug || docSnap.id;
      packages[id] = {
        id,
        name: data.title || data.name || 'Coaching Session',
        price: data.price || 0,
        currency: data.currency || 'USD',
        description: data.description || data.summary || '',
        duration: data.duration || '60 minutes',
        features: data.features || [],
        isActive: data.isActive ?? true,
        calLink: data.calLink || data.cal_link,
        eventType: data.eventType || data.event_type,
      };
    });

    // Update cache
    packagesCache = packages;
    packagesCacheTime = Date.now();
    
    return packages;
  } catch (error) {
    console.error('[Airwallex] Error fetching coaching packages:', error);
    // Return empty object on error - let callers handle gracefully
    return {};
  }
};

/**
 * Get a single coaching package by ID
 */
export const getCoachingPackage = async (packageId: string): Promise<CoachingPackage | null> => {
  const packages = await fetchCoachingPackages();
  return packages[packageId] || null;
};

export const createPaymentLink = async (
  data: PaymentLinkRequest
): Promise<PaymentLinkResponse> => {
  try {
    const result: ApiResponse = await invokeApi('/api/create-payment-link', {
      method: 'POST',
      body: data
    });

    if (!result.ok || !result.url || !result.id) {
      throw new Error(result.error || 'Failed to create payment link');
    }

    return { url: result.url, id: result.id };
  } catch (error) {
    console.error('Payment link creation error:', error);
    throw error;
  }
};
