
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/trackEvent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminShell from '@/components/admin/AdminShell';

interface Lead {
  id: string;
  name: string;
  email: string;
  stage?: string;
  source?: string;
  created_at: { seconds: number; nanoseconds: number; } | string; // Firestore timestamp or string
}

function formatTimestamp(ts: Lead['created_at']): string {
    if (typeof ts === 'string') {
        return new Date(ts).toLocaleDateString();
    }
    if (ts && typeof ts.seconds === 'number') {
        return new Date(ts.seconds * 1000).toLocaleDateString();
    }
    return 'Invalid date';
}

export default function Leads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('admin_leads_view');
    const q = query(
      collection(db, 'leads'),
      orderBy('created_at', 'desc'),
      limit(200)
    );

    // Set up realtime subscription with onSnapshot
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });
      
      setRows(leadsData);
      setLoading(false);
    }, (error) => {
      console.error('[Admin Leads] Snapshot error:', error);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <AdminShell><div className="p-6">Loading leads...</div></AdminShell>;
  }

  return (
    <AdminShell>
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Leads</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <StatusBadge status={row.stage || 'new'} />
                </TableCell>
                <TableCell>{row.source || '-'}</TableCell>
                <TableCell>{formatTimestamp(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'new' ? 'default' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
