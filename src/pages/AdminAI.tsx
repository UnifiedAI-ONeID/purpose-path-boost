import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Health = { ok:boolean; ai_enabled:boolean; has_key:boolean; cn_mode:boolean; timeout_ms:number; cache_ttl_s:number };
type LogRow = { id:number; at:string; route:string; mode:string; error:string|null; duration_ms:number|null; request:any };

export default function AdminAI(){
  const [health,setHealth]=useState<Health|null>(null);
  const [logs,setLogs]=useState<LogRow[]>([]);
  const [range,setRange]=useState<'1h'|'24h'|'7d'>('24h');
  const [loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);
    const { data: h } = await supabase.functions.invoke('api-ai-status');
    setHealth(h);
    const l = await fetch(`/api/ai/logs?range=${range}`).then(r=>r.json()).catch(()=>({rows:[]}));
    setLogs(l.rows||[]);
    setLoading(false);
  }
  
  useEffect(()=>{ load(); },[range]);

  const stats = logs.length > 0 ? {
    total: logs.length,
    google: logs.filter(l => l.mode === 'google').length,
    heuristic: logs.filter(l => l.mode === 'heuristic').length,
    cache: logs.filter(l => l.mode === 'cache').length,
    errors: logs.filter(l => l.error).length,
    avgDuration: Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length)
  } : null;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AI System Status</h1>
        <div className="flex gap-2">
          <select className="select" value={range} onChange={e=>setRange(e.target.value as any)}>
            <option value="1h">Last 1h</option><option value="24h">Last 24h</option><option value="7d">Last 7d</option>
          </select>
          <button className="btn btn-ghost" onClick={load}>Refresh</button>
        </div>
      </header>

      {health && (
        <section className="grid md:grid-cols-5 gap-3">
          <Card label="AI enabled" value={health.ai_enabled ? 'Yes' : 'No'} />
          <Card label="API key" value={health.has_key ? 'Yes' : 'No'} />
          <Card label="CN mode" value={health.cn_mode ? 'CN' : 'Global'} />
          <Card label="Timeout" value={`${health.timeout_ms}ms`} />
          <Card label="Cache TTL" value={`${health.cache_ttl_s}s`} />
        </section>
      )}

      {stats && (
        <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card label="Total" value={String(stats.total)} />
          <Card label="Google AI" value={String(stats.google)} color="emerald" />
          <Card label="Heuristic" value={String(stats.heuristic)} color="blue" />
          <Card label="Cache" value={String(stats.cache)} color="purple" />
          <Card label="Errors" value={String(stats.errors)} color="red" />
          <Card label="Avg ms" value={String(stats.avgDuration)} />
        </section>
      )}

      <section className="rounded-xl bg-surface border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-2 px-3">When</th><th className="py-2 px-3">Route</th><th className="py-2 px-3">Mode</th>
              <th className="py-2 px-3">ms</th><th className="py-2 px-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted">No logs yet</td></tr>
            ) : logs.map(r=>(
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="py-2 px-3 whitespace-nowrap text-xs">{new Date(r.at).toLocaleString()}</td>
                <td className="py-2 px-3 font-mono text-xs">{r.route}</td>
                <td className="py-2 px-3">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    r.mode === 'google' ? 'bg-emerald-100 text-emerald-700' :
                    r.mode === 'cache' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{r.mode}</span>
                </td>
                <td className="py-2 px-3 font-mono text-xs">{r.duration_ms ?? '—'}</td>
                <td className="py-2 px-3 text-xs text-red-600 truncate max-w-[420px]">{r.error||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Card({label,value,color}:{label:string; value:string; color?:'emerald'|'blue'|'purple'|'red'}){
  const bg = color ? `bg-${color}-50` : '';
  const txt = color ? `text-${color}-600` : '';
  return (
    <div className={`p-3 rounded-xl border border-border ${bg}`}>
      <div className="text-sm text-muted">{label}</div>
      <div className={`text-lg font-semibold ${txt}`}>{value}</div>
    </div>
  );
}
