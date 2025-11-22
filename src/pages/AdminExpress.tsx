import { useEffect, useState } from 'react';
import { supabase } from '@/db';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminExpress(){
  const [rows,setRows]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ 
    loadOrders();
  },[]);

  async function loadOrders(){
    setLoading(true);
    const { data } = await supabase
      .from('express_orders')
      .select('*')
      .order('created_at',{ascending:false})
      .limit(200);
    setRows(data||[]);
    setLoading(false);
  }

  return (
    <AdminShell>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-serif font-bold">Express Orders</h1>
          <button className="btn btn-ghost" onClick={loadOrders}>Refresh</button>
        </div>

        <div className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-muted">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted">No orders yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-muted">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r=>(
                  <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4">{r.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        r.status==='paid' ? 'bg-emerald-100 text-emerald-700' :
                        r.status==='cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{(r.amount_cents/100).toFixed(2)}</td>
                    <td className="py-3 px-4">{r.currency}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{r.notes||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminShell>
  );
}
