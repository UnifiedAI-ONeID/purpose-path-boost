/**
 * @file This file provides the admin interface for viewing Cal.com bookings
 * directly from the Firestore database.
 */

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import AdminShell from '@/components/admin/AdminShell';
import { logger } from '@/lib/log';

// --- Type Definitions ---

/**
 * Represents the structure of a single Cal.com booking record stored in Firestore.
 */
interface Booking {
  id: string;
  cal_uid: string;
  created_at: string;
  start_at: string;
  end_at: string;
  name: string;
  email: string;
  event_type_slug: string;
  status: 'booked' | 'canceled' | 'pending' | string;
  timezone: string;
}

// --- Helper Functions ---

/**
 * Converts a Firestore Timestamp or a string into a standard ISO string.
 * This handles cases where the data might be stored in different formats.
 * @param date - The date value from Firestore.
 * @returns {string} An ISO 8601 formatted date string.
 */
const formatDate = (date: any): string => {
  if (date instanceof Timestamp) {
    return date.toDate().toISOString();
  }
  return date as string;
};

// --- Main Component ---

export default function AdminCalBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'cal_bookings'),
        orderBy('created_at', 'desc'),
        limit(200)
      );
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          cal_uid: d.cal_uid,
          name: d.name,
          email: d.email,
          event_type_slug: d.event_type_slug,
          status: d.status,
          timezone: d.timezone,
          created_at: formatDate(d.created_at),
          start_at: formatDate(d.start_at),
          end_at: formatDate(d.end_at),
        } as Booking;
      });

      setBookings(data);
    } catch (error) {
      logger.error('[AdminCalBookings] Failed to load bookings from Firestore.', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-4">Cal.com Firestore Bookings</h1>
      {loading ? (
        <LoadingState />
      ) : (
        <BookingsTable bookings={bookings} />
      )}
    </AdminShell>
  );
}

// --- Sub-components for better structure ---

const LoadingState = () => <p className="text-muted">Loading bookings...</p>;

const BookingsTable = ({ bookings }: { bookings: Booking[] }) => (
  <div className="rounded-xl bg-surface border border-border overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-left text-muted border-b border-border">
        <tr>
          <th className="py-2 px-3">Created</th>
          <th className="py-2 px-3">Client</th>
          <th className="py-2 px-3">Type</th>
          <th className="py-2 px-3">Status</th>
          <th className="py-2 px-3">Start Time</th>
          <th className="py-2 px-3">End Time</th>
          <th className="py-2 px-3">Timezone</th>
        </tr>
      </thead>
      <tbody>
        {bookings.length === 0 ? (
          <tr>
            <td colSpan={7} className="p-6 text-center text-muted">No bookings found in Firestore.</td>
          </tr>
        ) : (
          bookings.map(booking => <BookingRow key={booking.cal_uid || booking.id} booking={booking} />)
        )}
      </tbody>
    </table>
  </div>
);

const BookingRow = ({ booking }: { booking: Booking }) => {
    const statusColors: Record<string, string> = {
        booked: 'bg-green-500/10 text-green-600',
        canceled: 'bg-red-500/10 text-red-600',
        pending: 'bg-yellow-500/10 text-yellow-600',
    };
    const statusColor = statusColors[booking.status] || 'bg-gray-500/10 text-gray-500';

    return (
        <tr className="border-t border-border">
            <td className="py-2 px-3 whitespace-nowrap">{new Date(booking.created_at).toLocaleString()}</td>
            <td className="py-2 px-3">{booking.name} <span className="text-muted">({booking.email})</span></td>
            <td className="py-2 px-3">{booking.event_type_slug}</td>
            <td className="py-2 px-3">
                <span className={`px-2 py-0.5 rounded text-xs ${statusColor}`}>
                    {booking.status}
                </span>
            </td>
            <td className="py-2 px-3 whitespace-nowrap">{new Date(booking.start_at).toLocaleString()}</td>
            <td className="py-2 px-3 whitespace-nowrap">{new Date(booking.end_at).toLocaleString()}</td>
            <td className="py-2 px-3">{booking.timezone}</td>
        </tr>
    );
};
