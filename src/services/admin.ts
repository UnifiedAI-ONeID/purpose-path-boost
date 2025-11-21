import { collection, getCountFromServer, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DataHealthStats {
  users: number;
  events: number;
  bookings: number;
  orders: number;
  leads: number;
  posts: number;
  lastUpdated: Record<string, string | null>;
}

export const adminService = {
  async getDataHealthStats(): Promise<DataHealthStats> {
    const collections = ['users', 'events', 'bookings', 'orders', 'leads', 'blog_posts'];
    const stats: any = { lastUpdated: {} };

    for (const col of collections) {
      const colRef = collection(db, col);
      
      // Get Count
      try {
        const snapshot = await getCountFromServer(colRef);
        stats[col === 'blog_posts' ? 'posts' : col] = snapshot.data().count;
      } catch (e) {
        stats[col === 'blog_posts' ? 'posts' : col] = -1;
      }

      // Get Last Updated (assuming createdAt or updatedAt field exists)
      // We try 'updatedAt' then 'createdAt'
      try {
        const q = query(colRef, orderBy('updatedAt', 'desc'), limit(1));
        const latest = await getDocs(q);
        if (!latest.empty) {
          stats.lastUpdated[col] = latest.docs[0].data().updatedAt;
        } else {
          // Try createdAt
          const q2 = query(colRef, orderBy('createdAt', 'desc'), limit(1));
          const latest2 = await getDocs(q2);
          if (!latest2.empty) {
            stats.lastUpdated[col] = latest2.docs[0].data().createdAt;
          } else {
            stats.lastUpdated[col] = null;
          }
        }
      } catch (e) {
        stats.lastUpdated[col] = null;
      }
    }

    return stats as DataHealthStats;
  },

  async getAnomalies() {
    const anomaliesRef = collection(db, 'admin_anomalies');
    const q = query(anomaliesRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
