import { collection, getDocs, query, where, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const integrityService = {
  async runChecks() {
    const anomalies = [];

    // Check 1: Bookings without valid user
    // Check 2: Orders without amount
    
    // For client-side check, we can't scan everything efficiently. 
    // We'll just check a sample or recent items.
    
    try {
      // Sample check: Recent bookings
      const bookingsRef = collection(db, 'bookings');
      const recentBookings = await getDocs(query(bookingsRef, limit(50)));
      
      for (const doc of recentBookings.docs) {
        const data = doc.data();
        if (!data.userId) {
          anomalies.push({
            entityType: 'booking',
            badDocPath: `bookings/${doc.id}`,
            description: 'Missing userId'
          });
        }
      }

      // Write anomalies
      const anomaliesRef = collection(db, 'admin_anomalies');
      for (const anomaly of anomalies) {
        await addDoc(anomaliesRef, {
          ...anomaly,
          createdAt: serverTimestamp()
        });
      }

      return anomalies.length;
    } catch (e) {
      console.error('Integrity check failed', e);
      throw e;
    }
  }
};
