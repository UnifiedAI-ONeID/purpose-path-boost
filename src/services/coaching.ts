import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CoachingOffer {
  id: string;
  slug: string;
  title: { en: string; zh: string; tw: string };
  description: { en: string; zh: string; tw: string };
  price: number;
  currency: string;
  features: string[];
  active: boolean;
  // ... other fields
}

export const coachingService = {
  async getPrograms(lang: string): Promise<any[]> {
    const offersRef = collection(db, 'coaching_offers');
    // We fetch all active offers and filter/localize client side or use specific queries if structure allows.
    // Assuming active field exists.
    const q = query(offersRef, where('active', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Localize
      const l = lang.startsWith('zh') ? (lang === 'zh-TW' ? 'tw' : 'zh') : 'en';
      
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        title: data.title?.[l] || data.title?.en || 'Untitled',
        description: data.description?.[l] || data.description?.en || '',
        price: data.price,
        currency: data.currency,
        features: data.features || [],
        active: data.active
      };
    });
  }
};
