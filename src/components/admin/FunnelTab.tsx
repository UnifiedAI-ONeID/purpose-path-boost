import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';

type Row = {
  week_start: string;
  leads: number;
  booked: number;
  won: number;
  cvr_booked_pct: number;
  cvr_won_pct: number;
  cvr_lead_to_client_pct: number;
};

function Spark({ data }: { data: number[] }) {
  if (!data.length) return <div className="h-10" />;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} opacity="0.7" />
    </svg>
  );
}

export default function FunnelTab() {
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data, error } = await supabase.from('v_funnel_weekly').select('*');
    if (!error && data) setRows(data as any);
  }

  useEffect(() => {
    load();
    const sub = supabase
      .channel('funnel_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const leadsSer = rows.map(r => r.leads);
  const bookedSer = rows.map(r => r.booked);
  const wonSer = rows.map(r => r.won);
  const l2cSer = rows.map(r => r.cvr_lead_to_client_pct);

  const headline = useMemo(() => {
    const cur = rows.at(-1);
    if (!cur) return null;
    return {
      leads: cur.leads,
      booked: cur.booked,
      won: cur.won,
      l2c: cur.cvr_lead_to_client_pct
    };
  }, [rows]);

  return (
    <section className="space-y-6">
      {/* Headline KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card label="Leads (this week)" value={headline?.leads ?? 0} />
        <Card label="Booked (this week)" value={headline?.booked ?? 0} />
        <Card label="Won (this week)" value={headline?.won ?? 0} />
        <Card label="Lead → Client %" value={`${headline?.l2c ?? 0}%`} />
      </div>

      {/* Trend mini-charts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Mini label="Leads (w/w)" data={leadsSer} />
        <Mini label="Booked (w/w)" data={bookedSer} />
        <Mini label="Won (w/w)" data={wonSer} />
        <Mini label="Lead→Client % (w/w)" data={l2cSer} />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2 px-3">Week</th>
              <th className="py-2 px-3">Leads</th>
              <th className="py-2 px-3">Booked</th>
              <th className="py-2 px-3">Won</th>
              <th className="py-2 px-3">Booked/Lead %</th>
              <th className="py-2 px-3">Won/Booked %</th>
              <th className="py-2 px-3">Lead→Client %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.week_start} className="border-t">
                <td className="py-2 px-3 whitespace-nowrap">{new Date(r.week_start).toLocaleDateString()}</td>
                <td className="py-2 px-3">{r.leads}</td>
                <td className="py-2 px-3">{r.booked}</td>
                <td className="py-2 px-3">{r.won}</td>
                <td className="py-2 px-3">{r.cvr_booked_pct}%</td>
                <td className="py-2 px-3">{r.cvr_won_pct}%</td>
                <td className="py-2 px-3 font-medium">{r.cvr_lead_to_client_pct}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-muted-foreground px-3" colSpan={7}>
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Targets helper */}
      <div className="rounded-lg border bg-card shadow-sm p-3 text-sm text-muted-foreground">
        Targets: Discovery call booking rate <strong>5–10%</strong>, Lead→Client <strong>5–15%</strong>.
        Use this tab to track trends weekly and tighten copy/offers when below target.
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg border bg-card shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Mini({ label, data }: { label: string; data: number[] }) {
  return (
    <div className="p-3 rounded-lg border bg-card shadow-sm">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <Spark data={data} />
    </div>
  );
}
