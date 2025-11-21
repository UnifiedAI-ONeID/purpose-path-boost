import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { invokeApi } from '@/lib/api-client';

type Alert = {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  message: string;
  action_url?: string;
  created_at: string;
  resolved_at?: string;
  source_key: string;
};

type Source = {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  last_checked_at?: string;
};

export default function AdminSEO() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [alertsData, sourcesData] = await Promise.all([
        invokeApi('/api/admin/seo/alerts?all=1'),
        invokeApi('/api/admin/seo/sources')
      ]);

      setAlerts(alertsData.rows || []);
      setSources(sourcesData.rows || []);
    } catch (error) {
      console.error('Failed to load SEO data:', error);
      toast.error('Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  }

  async function runScan() {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke('seo-watch');
      
      if (error) {
        throw error;
      }

      toast.success('SEO scan completed successfully');
      // Reload data after scan
      await loadData();
    } catch (error) {
      console.error('Failed to run SEO scan:', error);
      toast.error('Failed to run SEO scan');
    } finally {
      setRunning(false);
    }
  }

  async function resolveAlert(id: string) {
    try {
      const { error } = await supabase.functions.invoke('api-admin-seo-resolve', {
        body: { alertId: id }
      });

      if (error) {
        throw error;
      }

      setAlerts(alerts.map(a => 
        a.id === id ? { ...a, resolved_at: new Date().toISOString() } : a
      ));
      toast.success('Alert marked as resolved');
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error('Failed to resolve alert');
    }
  }

  async function toggleSource(id: string, enabled: boolean) {
    try {
      const result = await invokeApi('/api/admin/seo/sources', {
        method: 'POST',
        body: { id, enabled }
      });

      if (!result.ok) {
        throw new Error('Failed to update source');
      }

      setSources(sources.map(s => 
        s.id === id ? { ...s, enabled } : s
      ));
      toast.success(`Source ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle source:', error);
      toast.error('Failed to update source');
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  }

  function getSeverityBadge(severity: string) {
    const variants = {
      critical: 'destructive' as const,
      warn: 'secondary' as const,
      info: 'default' as const
    };
    return <Badge variant={variants[severity as keyof typeof variants]}>{severity.toUpperCase()}</Badge>;
  }

  const openAlerts = alerts.filter(a => !a.resolved_at);
  const resolvedAlerts = alerts.filter(a => a.resolved_at);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SEO Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Track external SEO changes and monitor your site's SEO health
            </p>
          </div>
          <Button onClick={runScan} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Scanning...' : 'Run Scan Now'}
          </Button>
        </div>

        {/* Watch Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Sources</CardTitle>
            <CardDescription>
              Enable or disable external sources to monitor for SEO changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{source.label}</div>
                    {source.last_checked_at && (
                      <div className="text-sm text-muted-foreground">
                        Last checked: {new Date(source.last_checked_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={source.enabled}
                    onCheckedChange={(checked) => toggleSource(source.id, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Open Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Active Alerts
              {openAlerts.length > 0 && (
                <Badge variant="destructive">{openAlerts.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Issues that require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {openAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No active alerts. Your SEO is looking good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openAlerts.map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{alert.title}</span>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.action_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={alert.action_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            Learn more <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resolved Alerts</CardTitle>
              <CardDescription>
                Previously resolved issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolvedAlerts.slice(0, 10).map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4 opacity-60">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.title}</span>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Resolved: {new Date(alert.resolved_at!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}