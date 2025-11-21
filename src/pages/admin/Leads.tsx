import { useEffect, useState } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminShell from '@/components/admin/AdminShell';

interface Lead {
  id: string;
  name: string;
  email: string;
  stage?: string;
  source?: string;
  created_at: string;
}

export default function Leads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();

    // Set up realtime subscription
    const channel = supabase
      .channel('leads-admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows((cur) => [payload.new as Lead, ...cur]);
          } else if (payload.eventType === 'UPDATE') {
            setRows((cur) => 
              cur.map((r) => r.id === payload.new.id ? payload.new as Lead : r)
            );
          } else if (payload.eventType === 'DELETE') {
            setRows((cur) => cur.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error('[Admin Leads] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }

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
                <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
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
