/**
 * @file Admin page for viewing a list of "Express" orders from the database.
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AdminShell from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { logger } from '@/lib/log';

// --- Type Definitions ---

interface Order {
  id: string;
  created_at: Date;
  name: string;
  email: string;
  status: 'paid' | 'pending' | 'cancelled';
  amount_cents: number;
  currency: string;
  notes: string | null;
}

// --- Main Component ---

export default function AdminExpress() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(200));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          created_at: (d.createdAt as Timestamp)?.toDate() || new Date(),
          name: d.customerDetails?.name || d.name || 'N/A',
          email: d.customerDetails?.email || d.email || 'N/A',
          status: d.status || 'pending',
          amount_cents: d.amount || 0,
          currency: d.currency || 'USD',
          notes: d.metadata?.notes || d.notes || null
        };
      });
      setOrders(data);
    } catch (error) {
      logger.error('[AdminExpress] Failed to load orders.', { error });
      toast.error('Failed to load express orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <AdminShell>
      <Header onRefresh={loadOrders} />
      {loading ? <LoadingSpinner /> : <OrdersTable orders={orders} />}
    </AdminShell>
  );
}

// --- Sub-components ---

const Header = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-3xl font-bold">Express Orders</h1>
    <Button variant="ghost" onClick={onRefresh}>Refresh</Button>
  </div>
);

const OrdersTable = ({ orders }: { orders: Order[] }) => {
    if (orders.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">No orders found.</div>;
    }
    return (
        <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map(order => <OrderRow key={order.id} order={order} />)}
                </TableBody>
            </Table>
        </div>
    );
};

const OrderRow = ({ order }: { order: Order }) => {
    const statusClasses = {
        paid: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-yellow-100 text-yellow-700',
        cancelled: 'bg-red-100 text-red-700',
    };
    return (
        <TableRow>
            <TableCell>{order.created_at.toLocaleDateString()}</TableCell>
            <TableCell>{order.name}</TableCell>
            <TableCell>{order.email}</TableCell>
            <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[order.status]}`}>
                    {order.status}
                </span>
            </TableCell>
            <TableCell>{(order.amount_cents / 100).toFixed(2)} {order.currency}</TableCell>
            <TableCell className="max-w-xs truncate">{order.notes || '—'}</TableCell>
        </TableRow>
    );
};

const LoadingSpinner = () => <div className="text-center py-12">Loading...</div>;
