import { useEffect, useState } from 'react';
import { fx } from '@/lib/edge';
import { auth } from '@/firebase/config';

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
        if (!auth.currentUser) {
          console.error('[useUserAnalytics] No active session');
          return;
        }

        const analyticsData = await fx(`dashboard-user-analytics`, 'GET', undefined, { profile_id: profileId });

        if (analyticsData?.ok) {
          setData(analyticsData);
        } else {
          console.error('[useUserAnalytics] Response not ok:', analyticsData);
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
