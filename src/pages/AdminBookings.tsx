import AdminShell from '../components/admin/AdminShell';
import { useEffect, useState } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

const getAdminBookings = httpsCallable(functions, 'api-admin-bookings');

export default function AdminBookings() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const result = await getAdminBookings();
      const data = result.data as { rows: any[] };
      setRows(data?.rows || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setRows([]);
    }
    setLoading(false);
  }

  return (
    <AdminShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all Cal.com bookings
          </p>
        </div>
        <button 
          onClick={loadBookings} 
          className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="p-3">When</th>
                <th className="p-3">Client</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    No bookings found
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr key={r.cal_uid} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="p-3">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {r.event_type_slug}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        r.status === 'confirmed' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
