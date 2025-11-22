
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { startOfWeek, format, parseISO } from 'date-fns';

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
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // Fetch all leads (optimized: only necessary fields)
      // In a large app, this should be a Cloud Function or an aggregated collection
      const q = query(collection(db, 'leads'), orderBy('created_at', 'asc'));
      const snapshot = await getDocs(q);

      const weeklyStats = new Map<string, { leads: number; booked: number; won: number }>();

      snapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.created_at instanceof Object && 'seconds' in data.created_at 
            ? new Date(data.created_at.seconds * 1000) 
            : new Date(data.created_at); // Handle both Timestamp and string
            
        const weekStart = format(startOfWeek(createdAt), 'yyyy-MM-dd');

        if (!weeklyStats.has(weekStart)) {
          weeklyStats.set(weekStart, { leads: 0, booked: 0, won: 0 });
        }

        const stat = weeklyStats.get(weekStart)!;
        stat.leads++;
        
        // Assuming stage determines booked/won status
        // Adjust logic based on your actual data model
        const stage = (data.stage || '').toLowerCase();
        if (['booked', 'won', 'client', 'active'].some(s => stage.includes(s))) {
            stat.booked++;
        }
        if (['won', 'client'].some(s => stage.includes(s))) {
            stat.won++;
        }
      });

      const calculatedRows: Row[] = Array.from(weeklyStats.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week_start, stats]) => ({
          week_start,
          leads: stats.leads,
          booked: stats.booked,
          won: stats.won,
          cvr_booked_pct: stats.leads ? Math.round((stats.booked / stats.leads) * 100) : 0,
          cvr_won_pct: stats.booked ? Math.round((stats.won / stats.booked) * 100) : 0,
          cvr_lead_to_client_pct: stats.leads ? Math.round((stats.won / stats.leads) * 100) : 0,
        }));

      setRows(calculatedRows);
    } catch (error) {
      console.error("Failed to load funnel data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading funnel analytics...</div>;

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
                <td className="py-2 px-3 whitespace-nowrap">{r.week_start}</td>
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
