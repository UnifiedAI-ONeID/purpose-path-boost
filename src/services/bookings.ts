import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Booking {
  id?: string;
  userId: string;
  eventTypeId: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'pending';
  guestEmail?: string;
  guestName?: string;
  notes?: string;
  meetingUrl?: string;
  createdAt: Date;
}

const COLLECTION_NAME = 'bookings';

export const bookingService = {
  /**
   * Get all bookings for a specific user
   */
  async getUserBookings(userId: string): Promise<Booking[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      orderBy('startTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: (doc.data().startTime as Timestamp).toDate(),
      endTime: (doc.data().endTime as Timestamp).toDate(),
      createdAt: (doc.data().createdAt as Timestamp).toDate()
    } as Booking));
  },

  /**
   * Get a single booking by ID
   */
  async getBookingById(bookingId: string): Promise<Booking | null> {
    const docRef = doc(db, COLLECTION_NAME, bookingId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate()
    } as Booking;
  },

  /**
   * Create a new booking
   */
  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>) {
    const data = {
      ...booking,
      createdAt: new Date(), // Client-side timestamp, security rules can validate
      status: booking.status || 'pending'
    };
    
    return await addDoc(collection(db, COLLECTION_NAME), data);
  },

  /**
   * Update booking status
   */
  async updateStatus(bookingId: string, status: Booking['status']) {
    const docRef = doc(db, COLLECTION_NAME, bookingId);
    await updateDoc(docRef, { status });
  }
};
