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
};

export default function LeadsTable() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<string>('all');
  const [source, setSource] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (error) {
      toast.error('Failed to load leads');
      console.error(error);
    } else {
      setRows((data || []) as Lead[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    
    const channel = supabase
      .channel('leads_table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (stage !== 'all' && r.stage !== stage) return false;
    if (source !== 'all' && r.source !== source) return false;
    const text = (r.name || '') + ' ' + (r.email || '') + ' ' + (r.country || '') + ' ' + (r.notes || '') + ' ' + (r.tags || []).join(' ');
    return text.toLowerCase().includes(q.toLowerCase());
  }), [rows, q, stage, source]);

  async function update(id: string, patch: Partial<Lead>) {
    const { error } = await supabase.from('leads').update(patch).eq('id', id);
    if (error) {
      toast.error('Failed to update lead');
      console.error(error);
    } else {
      toast.success('Lead updated');
    }
  }

  function exportCSV() {
    const header = ['created_at', 'name', 'email', 'language', 'country', 'source', 'quiz_score', 'stage', 'tags', 'notes'];
    const lines = [header.join(',')].concat(filtered.map(r => [
      r.created_at,
      csv(r.name),
      csv(r.email),
      r.language,
      r.country || '',
      r.source,
      r.quiz_score ?? '',
      r.stage,
      `"${(r.tags || []).join('|')}"`,
      csv(r.notes || '')
    ].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
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
          <Button onClick={exportCSV}>Export CSV</Button>
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
              <TableHead>Tags</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.source}</TableCell>
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
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-muted-foreground text-center" colSpan={7}>
                  No leads yet.
                </TableCell>
              </TableRow>
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
    />
  );
}

function InlineNote({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  
  return (
    <div className="flex gap-2">
      <Textarea
        rows={2}
        value={v}
        onChange={e => setV(e.target.value)}
        className="min-w-[200px]"
      />
      <Button variant="outline" size="sm" onClick={() => onSave(v)}>
        Save
      </Button>
    </div>
  );
}
