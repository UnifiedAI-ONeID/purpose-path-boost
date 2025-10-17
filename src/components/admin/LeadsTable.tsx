import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  language: string;
  country: string | null;
  source: string;
  quiz_score: number | null;
  stage: 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
  tags: string[] | null;
  notes: string | null;
  wechat?: string | null;
  clarity_score?: number | null;
};

export default function LeadsTable() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<string>('all');
  const [source, setSource] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to view leads');
        return;
      }

      const response = await supabase.functions.invoke('api-admin-leads-list', {
        body: {
          limit: 100,
          sortBy: 'created_at',
          sortOrder: 'desc',
          ...(stage !== 'all' && { stage }),
          ...(source !== 'all' && { source }),
          ...(q && { search: q })
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('[LeadsTable] Error loading leads:', response.error);
        toast.error('Failed to load leads');
        return;
      }

      if (response.data?.ok && response.data.leads) {
        setRows(response.data.leads || []);
      }
    } catch (error) {
      console.error('[LeadsTable] Exception:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [stage, source, q]);

  useEffect(() => {
    // Initial load
    load();
    
    // Realtime subscription for updates
    const channel = supabase
      .channel('leads_table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function update(id: string, patch: Partial<Lead>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('api-admin-leads-update', {
        body: { id, ...patch },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('[LeadsTable] Error updating lead:', response.error);
        toast.error('Failed to update lead');
        return;
      }

      if (response.data?.ok) {
        toast.success('Lead updated');
        load();
      }
    } catch (error) {
      console.error('[LeadsTable] Exception:', error);
      toast.error('Failed to update lead');
    }
  }

  async function exportToCSV() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('api-admin-leads-export', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('[LeadsTable] Error exporting:', response.error);
        toast.error('Failed to export leads');
        return;
      }

      // Response is CSV text
      const csv = response.data;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Leads exported successfully');
    } catch (error) {
      console.error('[LeadsTable] Export exception:', error);
      toast.error('Failed to export leads');
    }
  }

  function csv(s: any) {
    return `"${String(s || '').replace(/"/g, '""')}"`;
  }

  const sources = useMemo(() => Array.from(new Set(rows.map(r => r.source).filter(Boolean))).sort(), [rows]);

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            className="w-full md:w-64"
            placeholder="Search name/email/tags/notes…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['all', 'new', 'contacted', 'qualified', 'won', 'lost'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all sources</SelectItem>
              {sources.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={exportToCSV}>Export CSV</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Scores</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="py-6 text-center" colSpan={8}>
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell className="py-6 text-muted-foreground text-center" colSpan={8}>
                  No leads found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell className="capitalize">{r.source}</TableCell>
                  <TableCell>
                    <Select
                      value={r.stage}
                      onValueChange={(value) => update(r.id, { stage: value as any })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['new', 'contacted', 'qualified', 'won', 'lost'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {r.quiz_score && <div>Quiz: {r.quiz_score}</div>}
                      {r.clarity_score && <div>Clarity: {r.clarity_score}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TagEditor
                      value={r.tags || []}
                      onChange={(tags) => update(r.id, { tags })}
                    />
                  </TableCell>
                  <TableCell className="min-w-[240px]">
                    <InlineNote
                      value={r.notes || ''}
                      onSave={(notes) => update(r.id, { notes })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function TagEditor({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const [text, setText] = useState(value.join(', '));
  
  useEffect(() => setText(value.join(', ')), [value]);
  
  return (
    <Input
      value={text}
      onChange={e => {
        setText(e.target.value);
        onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean));
      }}
      className="min-w-[120px]"
      placeholder="Add tags..."
    />
  );
}

function InlineNote({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  
  useEffect(() => setV(value), [value]);
  
  if (!editing && !value) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        Add note
      </Button>
    );
  }
  
  if (!editing) {
    return (
      <div 
        className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
        onClick={() => setEditing(true)}
      >
        {value}
      </div>
    );
  }
  
  return (
    <div className="flex gap-2">
      <Textarea
        rows={2}
        value={v}
        onChange={e => setV(e.target.value)}
        className="min-w-[200px]"
        placeholder="Add notes..."
      />
      <div className="flex flex-col gap-1">
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => {
            onSave(v);
            setEditing(false);
          }}
        >
          Save
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setV(value);
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
