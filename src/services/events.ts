import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  startTime: Date;
  endTime: Date;
  price: number;
  currency: string;
  capacity: number;
  isPublished: boolean;
  coverImage?: string;
  location?: string; // URL or physical
}

const COLLECTION = 'events';

export const eventService = {
  /**
   * List upcoming published events
   */
  async getUpcomingEvents(limitCount = 10): Promise<Event[]> {
    const now = new Date();
    const q = query(
      collection(db, COLLECTION),
      where('isPublished', '==', true),
      where('startTime', '>=', now),
      orderBy('startTime', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate()
      } as Event;
    });
  },

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<Event | null> {
    const snap = await getDoc(doc(db, COLLECTION, eventId));
    if (!snap.exists()) return null;
    
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate()
    } as Event;
  },

  /**
   * Get event by slug (requires index on 'slug')
   */
  async getEventBySlug(slug: string): Promise<Event | null> {
    const q = query(collection(db, COLLECTION), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const d = snap.docs[0];
    const data = d.data();
    return {
      id: d.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate()
    } as Event;
  }
};
