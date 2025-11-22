import { useEffect, useState } from 'react';
import { supabase } from '@/db';

export default function UpcomingSessions({ profileId }: { profileId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: result } = await supabase.functions.invoke('dashboard-user-summary');
        setData(result);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId]);

  const session = data?.next_session;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="font-semibold text-lg">Your next session</div>
      {!session ? (
        <div className="text-sm text-muted-foreground mt-2">
          No upcoming session. Book now?
        </div>
      ) : (
        <div className="mt-2">
          <div className="text-sm">{new Date(session.start_at).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{session.title || 'Coaching session'}</div>
        </div>
      )}
      <div className="mt-4">
        <a className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium" href="/coaching">
          Book a session
        </a>
      </div>
    </div>
  );
}
