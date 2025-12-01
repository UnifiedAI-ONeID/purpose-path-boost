import { useEffect, useState, useCallback } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { invokeApi } from '@/lib/api-client';
import { logger } from '@/lib/log';

// --- Type Definitions ---

type HealthStatus = {
  ok: boolean;
  ai_enabled: boolean;
  has_key: boolean;
  cn_mode: boolean;
  timeout_ms: number;
  cache_ttl_s: number;
};

type LogRow = {
  id: number;
  at: string;
  route: string;
  mode: 'google' | 'heuristic' | 'cache' | 'error';
  error: string | null;
  duration_ms: number | null;
  request: any; // Kept as 'any' for flexibility, but could be typed further if the structure is known.
};

type TimeRange = '1h' | '24h' | '7d';

// --- Firebase Cloud Function Reference ---

const getAiStatus = httpsCallable<void, HealthStatus>(functions, 'api-ai-status');

// --- Component ---

export default function AdminAI() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [range, setRange] = useState<TimeRange>('24h');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch health status and logs in parallel for faster loading.
      const [healthResult, logsResponse] = await Promise.all([
        getAiStatus(),
        invokeApi<{ rows: LogRow[] }>('/api/ai/logs', { method: 'POST', body: { range } }),
      ]);
      
      setHealth(healthResult.data);
      setLogs(logsResponse.rows || []);
      
    } catch (error) {
      logger.error('[AdminAI] Failed to load data.', { error });
      // Optionally, set an error state to display a message to the user.
    } finally {
      setLoading(false);
    }
  }, [range]); // Dependency on `range` is key for re-fetching when it changes.
  
  useEffect(() => {
    loadData();
  }, [loadData]); // Using `loadData` as the dependency.

  const stats = logs.length > 0 ? {
    total: logs.length,
    google: logs.filter(l => l.mode === 'google').length,
    heuristic: logs.filter(l => l.mode === 'heuristic').length,
    cache: logs.filter(l => l.mode === 'cache').length,
    errors: logs.filter(l => l.error).length,
    avgDuration: Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length),
  } : null;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <Header range={range} setRange={setRange} onRefresh={loadData} />
      {health && <HealthSection health={health} />}
      {stats && <StatsSection stats={stats} />}
      <LogsTable logs={logs} loading={loading} />
    </main>
  );
}

// --- Sub-components for better structure and readability ---

const Header = ({ range, setRange, onRefresh }: { range: TimeRange, setRange: (r: TimeRange) => void, onRefresh: () => void }) => (
  <header className="flex items-center justify-between">
    <h1 className="text-2xl font-semibold">AI System Status</h1>
    <div className="flex gap-2">
      <select className="select" value={range} onChange={e => setRange(e.target.value as TimeRange)}>
        <option value="1h">Last 1h</option>
        <option value="24h">Last 24h</option>
        <option value="7d">Last 7d</option>
      </select>
      <button className="btn btn-ghost" onClick={onRefresh}>Refresh</button>
    </div>
  </header>
);

const HealthSection = ({ health }: { health: HealthStatus }) => (
  <section className="grid md:grid-cols-5 gap-3">
    <InfoCard label="AI Enabled" value={health.ai_enabled ? 'Yes' : 'No'} />
    <InfoCard label="API Key" value={health.has_key ? 'Configured' : 'Missing'} />
    <InfoCard label="Region Mode" value={health.cn_mode ? 'CN' : 'Global'} />
    <InfoCard label="Timeout" value={`${health.timeout_ms}ms`} />
    <InfoCard label="Cache TTL" value={`${health.cache_ttl_s}s`} />
  </section>
);

const StatsSection = ({ stats }: { stats: NonNullable<ReturnType<typeof calculateStats>> }) => (
  <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
    <InfoCard label="Total Calls" value={String(stats.total)} />
    <InfoCard label="Google AI" value={String(stats.google)} color="emerald" />
    <InfoCard label="Heuristic" value={String(stats.heuristic)} color="blue" />
    <InfoCard label="Cache Hits" value={String(stats.cache)} color="purple" />
    <InfoCard label="Errors" value={String(stats.errors)} color="red" />
    <InfoCard label="Avg Duration (ms)" value={String(stats.avgDuration)} />
  </section>
);

const LogsTable = ({ logs, loading }: { logs: LogRow[], loading: boolean }) => (
  <section className="rounded-xl bg-surface border border-border overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted">
          <th className="py-2 px-3">When</th>
          <th className="py-2 px-3">Route</th>
          <th className="py-2 px-3">Mode</th>
          <th className="py-2 px-3">Duration (ms)</th>
          <th className="py-2 px-3">Error</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={5} className="py-12 text-center text-muted">Loading logs...</td></tr>
        ) : logs.length === 0 ? (
          <tr><td colSpan={5} className="py-12 text-center text-muted">No logs found for this period.</td></tr>
        ) : logs.map(log => <LogItem key={log.id} log={log} />)}
      </tbody>
    </table>
  </section>
);

const LogItem = ({ log }: { log: LogRow }) => {
  const modeColors = {
    google: 'bg-emerald-100 text-emerald-700',
    cache: 'bg-purple-100 text-purple-700',
    heuristic: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700',
  };
  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="py-2 px-3 whitespace-nowrap text-xs">{new Date(log.at).toLocaleString()}</td>
      <td className="py-2 px-3 font-mono text-xs">{log.route}</td>
      <td className="py-2 px-3">
        <span className={`inline-block px-2 py-1 text-xs rounded ${modeColors[log.mode]}`}>{log.mode}</span>
      </td>
      <td className="py-2 px-3 font-mono text-xs">{log.duration_ms ?? '—'}</td>
      <td className="py-2 px-3 text-xs text-red-600 truncate max-w-[420px]">{log.error || '—'}</td>
    </tr>
  );
};

const InfoCard = ({ label, value, color }: { label: string; value: string; color?: 'emerald' | 'blue' | 'purple' | 'red' }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };
  const bgColor = color ? colorClasses[color] : '';
  return (
    <div className={`p-3 rounded-xl border border-border ${bgColor}`}>
      <div className="text-sm text-muted">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
};

// Helper to avoid re-calculating stats inside the component render body.
const calculateStats = (logs: LogRow[]) => {
    if (logs.length === 0) return null;
    return {
        total: logs.length,
        google: logs.filter(l => l.mode === 'google').length,
        heuristic: logs.filter(l => l.mode === 'heuristic').length,
        cache: logs.filter(l => l.mode === 'cache').length,
        errors: logs.filter(l => l.error).length,
        avgDuration: Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length),
    };
};
