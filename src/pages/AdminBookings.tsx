/**
 * @file This file provides the admin interface for viewing and managing bookings
 * retrieved from the Cal.com integration.
 */

import AdminShell from '../components/admin/AdminShell';
import { useEffect, useState, useCallback } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { logger } from '@/lib/log';

// --- Type Definitions ---

/**
 * Represents the structure of a single booking record.
 */
interface Booking {
  cal_uid: string;
  created_at: string;
  name: string;
  email: string;
  event_type_slug: string;
  status: 'confirmed' | 'pending' | 'cancelled' | string; // Allow for other statuses
}

// --- Firebase Cloud Function Reference ---

const getAdminBookings = httpsCallable<void, { rows: Booking[] }>(functions, 'api-admin-bookings');

// --- Main Component ---

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminBookings();
      setBookings(result.data?.rows || []);
    } catch (error) {
      logger.error('[AdminBookings] Failed to load bookings.', { error });
      setBookings([]); // Reset to empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <AdminShell>
      <Header onRefresh={loadBookings} />
      <BookingsTable bookings={bookings} loading={loading} />
    </AdminShell>
  );
}

// --- Sub-components for better readability and structure ---

const Header = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <p className="text-sm text-muted-foreground mt-1">
        View and manage all Cal.com bookings
      </p>
    </div>
    <button
      onClick={onRefresh}
      className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent"
    >
      Refresh
    </button>
  </div>
);

const BookingsTable = ({ bookings, loading }: { bookings: Booking[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground border-b border-border">
          <tr>
            <th className="p-3">When</th>
            <th className="p-3">Client</th>
            <th className="p-3">Type</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-12 text-center text-muted-foreground">
                No bookings found.
              </td>
            </tr>
          ) : (
            bookings.map(booking => <BookingRow key={booking.cal_uid} booking={booking} />)
          )}
        </tbody>
      </table>
    </div>
  );
};

const BookingRow = ({ booking }: { booking: Booking }) => {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    cancelled: 'bg-red-500/10 text-red-500',
  };
  const statusColor = statusColors[booking.status] || 'bg-gray-500/10 text-gray-500';

  return (
    <tr className="border-b border-border last:border-0 hover:bg-accent/50">
      <td className="p-3 whitespace-nowrap">
        {new Date(booking.created_at).toLocaleString()}
      </td>
      <td className="p-3">
        <div className="font-medium">{booking.name}</div>
        <div className="text-xs text-muted-foreground">{booking.email}</div>
      </td>
      <td className="p-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
          {booking.event_type_slug}
        </span>
      </td>
      <td className="p-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusColor}`}>
          {booking.status}
        </span>
      </td>
    </tr>
  );
};
