import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CoachingOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  stripePriceId?: string;
}

const COLLECTION = 'products/coaching'; // Note: if this is a subcollection path, handle carefully. 
// In our manifest, we used /products/coaching/{offerId}, but Firestore client libraries 
// usually treat 'products' as collection, 'coaching' as doc, then subcollection.
// If we meant top-level 'coaching_offers', we should change manifest or code.
// Let's assume we actually meant top-level collection 'coaching_offers' for simplicity
// OR we use a collection group query if it's truly nested.
// Let's stick to a top-level collection 'coaching_offers' for easier access, 
// matching the Supabase original more closely.

const ACTUAL_COLLECTION = 'coaching_offers'; 

export const coachingService = {
  async getActiveOffers(): Promise<CoachingOffer[]> {
    const q = query(
      collection(db, ACTUAL_COLLECTION),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CoachingOffer));
  }
};
