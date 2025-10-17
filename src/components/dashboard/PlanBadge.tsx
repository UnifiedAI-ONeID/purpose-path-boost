import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function PlanBadge({ profileId }: { profileId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: result } = await supabase.functions.invoke('dashboard-user-summary');
        setData(result);
      } catch (error) {
        console.error('Failed to load plan:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId]);

  if (loading) return <div className="rounded-lg border bg-card shadow-sm p-6 w-64">Loading...</div>;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 w-64">
      <div className="text-sm text-muted-foreground">Current plan</div>
      <div className="text-xl font-semibold capitalize mt-1">{data?.plan || 'free'}</div>
      <div className="text-sm mt-1">
        {data?.plan === 'free' ? `${data?.remaining || 0} lesson(s) left` : 'All-access'}
      </div>
      <div className="mt-4 flex gap-2">
        <a className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium" href="/pricing">
          Change plan
        </a>
        <a className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 text-sm font-medium" href="/coaching">
          Book
        </a>
      </div>
    </div>
  );
}
