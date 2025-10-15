import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} opacity="0.6" />
    </svg>
  );
}

export default function LeadsOverview() {
  const [total, setTotal] = useState(0);
  const [wins, setWins] = useState(0);
  const [today, setToday] = useState(0);
  const [series, setSeries] = useState<number[]>([]);

  const fetchData = async () => {
    const { data: all } = await supabase.from('leads').select('id,created_at,stage');
    if (!all) return;
    
    setTotal(all.length);
    setWins(all.filter(l => l.stage === 'won').length);
    
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    setToday(all.filter(l => new Date(l.created_at) >= start).length);
    
    // 14-day sparkline
    const days = [...Array(14)].map((_, i) => {
      const d0 = new Date();
      d0.setDate(d0.getDate() - (13 - i));
      d0.setHours(0, 0, 0, 0);
      const d1 = new Date(d0);
      d1.setDate(d0.getDate() + 1);
      return all.filter(l => new Date(l.created_at) >= d0 && new Date(l.created_at) < d1).length;
    });
    setSeries(days);
  };

  useEffect(() => {
    fetchData();

    // realtime subscription
    const channel = supabase
      .channel('leads_overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cards = useMemo(() => [
    { label: 'Total Leads', value: total },
    { label: 'Won (Clients)', value: wins },
    { label: 'Today', value: today }
  ], [total, wins, today]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardDescription>{c.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Spark data={series} />
          <div className="text-muted-foreground text-xs mt-1">Last 14 days</div>
        </CardContent>
      </Card>
    </section>
  );
}
