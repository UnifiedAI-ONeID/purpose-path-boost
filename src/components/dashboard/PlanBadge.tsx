import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { PlanBadge } from '@/components/dashboard/PlanBadge';
import { fx } from '@/lib/edge';

interface UserSummaryResponse {
  ok: boolean;
  plan: string;
}

export function PlanBadgeWrapper() {
  const [summary, setSummary] = useState<UserSummaryResponse | null>(null);

  useEffect(() => {
    fx('dashboard-user-summary').then((data) => {
        if (data?.ok) setSummary(data);
    });
  }, []);

  if (!summary) return null;

  return (
    <PlanBadge plan={summary.plan} />
  );
}
