import { useEffect, useState } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { invokeApi } from '@/lib/api-client';

type Alert = {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  message: string;
  action_url?: string;
};

export default function SeoAlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const { data, error } = await supabase.functions.invoke('api-admin-seo-alerts', {
          body: { open: 1 }
        });
        
        if (error) throw error;
        setAlerts(data || []);
      } catch (error) {
        console.error('Failed to load SEO alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function dismissAlert(id: string) {
    try {
      const result = await invokeApi('/api/admin/seo/resolve', {
        method: 'POST',
        body: { id }
      });

      if (result.ok) {
        setAlerts(alerts.filter(a => a.id !== id));
        toast.success('Alert dismissed');
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      toast.error('Failed to dismiss alert');
    }
  }

  if (loading || !alerts || alerts.length === 0) {
    return null;
  }

  const topAlert = alerts[0];
  
  const bgColor = topAlert.severity === 'critical' 
    ? 'bg-destructive'
    : topAlert.severity === 'warn'
    ? 'bg-amber-500'
    : 'bg-blue-500';

  const Icon = topAlert.severity === 'critical'
    ? AlertCircle
    : topAlert.severity === 'warn'
    ? AlertTriangle
    : Info;

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg flex items-center justify-between gap-4 mb-4`}>
      <div className="flex items-center gap-3 flex-1">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">{topAlert.title}</div>
          <div className="text-sm opacity-90">{topAlert.message}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {topAlert.action_url && (
          <a
            href={topAlert.action_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            Learn more
          </a>
        )}
        <button
          onClick={() => dismissAlert(topAlert.id)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}