import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminCalBookings() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cal_bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-3">Cal.com Bookings</h1>
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-3">Cal.com Bookings</h1>
      <div className="rounded-xl bg-surface border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 px-3">Created</th>
              <th className="py-2 px-3">Client</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Start</th>
              <th className="py-2 px-3">End</th>
              <th className="py-2 px-3">TZ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cal_uid} className="border-t border-border">
                <td className="py-2 px-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="py-2 px-3">
                  {r.name} <span className="text-muted">({r.email})</span>
                </td>
                <td className="py-2 px-3">{r.event_type_slug}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      r.status === 'booked'
                        ? 'bg-green-500/10 text-green-600'
                        : r.status === 'canceled'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-2 px-3">{new Date(r.start_at).toLocaleString()}</td>
                <td className="py-2 px-3">{new Date(r.end_at).toLocaleString()}</td>
                <td className="py-2 px-3">{r.timezone}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6 text-center text-muted">No bookings found</div>
        )}
      </div>
    </main>
  );
}
