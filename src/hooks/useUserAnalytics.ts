import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserAnalytics = {
  ok: boolean;
  streak: number;
  minutes: { d7: number; d30: number };
  completion: { starts30: number; completes30: number; rate: number };
  bookings: { month: { booked: number; attended: number } };
  plan: {
    slug: string;
    remaining: number | null;
    window: { start: string; end: string };
  };
  referrals: { invited: number; converted: number };
  habits: number;
  next_best_action: {
    title: string;
    cta: string;
    href: string;
    reason: string;
  };
  now: string;
};

export function useUserAnalytics(profileId: string | undefined) {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    async function fetchAnalytics() {
      try {
        const { data: analyticsData, error } = await supabase.functions.invoke(
          'dashboard-user-analytics',
          {
            body: { profile_id: profileId }
          }
        );

        if (error) throw error;
        if (analyticsData?.ok) {
          setData(analyticsData);
        }
      } catch (error) {
        console.error('[useUserAnalytics] Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [profileId]);

  return { data, loading };
}
