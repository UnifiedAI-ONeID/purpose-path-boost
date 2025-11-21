import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Event {
  id: string;
  title: { en: string; zh?: string; tw?: string } | string;
  description: { en: string; zh?: string; tw?: string } | string;
  slug: string;
  startTime: any; // Timestamp
  endTime: any;
  published: boolean;
  location?: string;
  cover_url?: string; // Kept for compatibility or should be migrated to 'images'
  images?: string[];
  // ... other fields
}

export const eventService = {
  async getEvents(publishedOnly = true) {
    const eventsRef = collection(db, 'events');
    let q = query(eventsRef, orderBy('startTime', 'asc'));
    
    if (publishedOnly) {
      q = query(q, where('published', '==', true));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        startTime: data.startTime?.toDate?.() || new Date(data.startTime),
        endTime: data.endTime?.toDate?.() || new Date(data.endTime)
      } as Event;
    });
  },

  async getUpcomingEvents() {
    const eventsRef = collection(db, 'events');
    const now = new Date();
    
    // Firestore requires composite index for this query: published == true AND endTime >= now
    // If index is missing, it will throw.
    const q = query(
      eventsRef, 
      where('published', '==', true),
      where('endTime', '>=', now),
      orderBy('endTime', 'asc') // Usually requires ordering by filter field first
    );
    
    // If we want to order by startTime, we might need to filter client side or composite index
    
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        // Compatibility mapping if needed.
        // Supabase field 'start_at' -> Firestore 'startTime'
        // In the UI code it uses 'start_at'. I should map it.
        start_at: data.startTime?.toDate?.()?.toISOString() || data.startTime,
        end_at: data.endTime?.toDate?.()?.toISOString() || data.endTime,
        cover_url: data.images?.[0] || data.cover_url,
        // Handle i18n titles if they are objects
        title: typeof data.title === 'object' ? (data.title.en || 'Untitled') : data.title,
        summary: typeof data.description === 'object' ? (data.description.en || '') : data.description
      } as any;
    });

    // Re-sort by start time client side since we queried by endTime
    return events.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  },

  async getEventBySlug(slug: string) {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return { 
      id: snapshot.docs[0].id, 
      ...data,
      start_at: data.startTime?.toDate?.()?.toISOString(),
      end_at: data.endTime?.toDate?.()?.toISOString()
    } as any;
  },
  
  async getEventById(id: string) {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        start_at: data.startTime?.toDate?.()?.toISOString(),
        end_at: data.endTime?.toDate?.()?.toISOString()
      } as any;
    }
    return null;
  }
};
