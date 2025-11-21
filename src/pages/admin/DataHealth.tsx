import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService, DataHealthStats } from '@/services/admin';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DataHealth() {
  const [stats, setStats] = useState<DataHealthStats | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        adminService.getDataHealthStats(),
        adminService.getAnomalies()
      ]);
      setStats(s);
      setAnomalies(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminShell title="Data Health">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats && Object.entries(stats).filter(([k]) => k !== 'lastUpdated').map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                  {key}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof value === 'number' && value === -1 ? 'Err' : value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last update: {stats.lastUpdated[key === 'posts' ? 'blog_posts' : key] ? 
                    formatDistanceToNow(new Date(stats.lastUpdated[key === 'posts' ? 'blog_posts' : key] as string), { addSuffix: true }) : 
                    'N/A'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Anomalies Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Detected Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
                <p>No anomalies detected. System healthy.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {anomalies.map(anomaly => (
                  <div key={anomaly.id} className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-destructive">{anomaly.entityType} Error</h4>
                      <p className="text-sm mt-1">{anomaly.description}</p>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded mt-2 block w-fit">
                        {anomaly.badDocPath}
                      </code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {anomaly.createdAt?.toDate ? 
                        formatDistanceToNow(anomaly.createdAt.toDate(), { addSuffix: true }) : 
                        'Unknown time'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
