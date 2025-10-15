import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAI() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Get status
    const statusRes = await fetch('/api/ai/status').then(r => r.json()).catch(() => null);
    setStatus(statusRes);

    // Get logs
    const { data: logsData } = await supabase
      .from('ai_logs')
      .select('*')
      .order('at', { ascending: false })
      .limit(100);
    setLogs(logsData || []);

    // Calculate stats
    if (logsData && logsData.length > 0) {
      const total = logsData.length;
      const google = logsData.filter(l => l.mode === 'google').length;
      const heuristic = logsData.filter(l => l.mode === 'heuristic').length;
      const cache = logsData.filter(l => l.mode === 'cache').length;
      const errors = logsData.filter(l => l.error).length;
      const avgDuration = Math.round(
        logsData.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / total
      );

      setStats({ total, google, heuristic, cache, errors, avgDuration });
    }

    setLoading(false);
  }

  return (
    <main className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">AI System Status</h1>
        <button className="btn btn-ghost" onClick={loadData}>Refresh</button>
      </div>

      {/* Status Card */}
      {status && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted">AI Enabled</div>
              <div className="text-2xl font-bold">
                {status.ai_enabled ? '✓' : '✗'}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted">API Key</div>
              <div className="text-2xl font-bold">
                {status.has_key ? '✓' : '✗'}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted">CN Mode</div>
              <div className="text-2xl font-bold">
                {status.cn_mode ? '✓' : '✗'}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted">Cache TTL</div>
              <div className="text-2xl font-bold">{status.cache_ttl_s}s</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Card */}
      {stats && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted">Total Requests</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-emerald-50">
              <div className="text-sm text-muted">Google AI</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.google}</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-blue-50">
              <div className="text-sm text-muted">Heuristic</div>
              <div className="text-2xl font-bold text-blue-600">{stats.heuristic}</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-purple-50">
              <div className="text-sm text-muted">Cache Hits</div>
              <div className="text-2xl font-bold text-purple-600">{stats.cache}</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-red-50">
              <div className="text-sm text-muted">Errors</div>
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-sm text-muted">Avg Duration</div>
              <div className="text-2xl font-bold">{stats.avgDuration}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted">No logs yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/30">
                  <td className="py-3 px-4 text-xs">
                    {new Date(log.at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{log.route}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      log.mode === 'google' ? 'bg-emerald-100 text-emerald-700' :
                      log.mode === 'cache' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {log.mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{log.duration_ms}ms</td>
                  <td className="py-3 px-4 text-xs max-w-xs truncate">
                    {log.error ? (
                      <span className="text-red-600">{log.error}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
