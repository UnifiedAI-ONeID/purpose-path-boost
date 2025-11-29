
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { PlanBadge } from '@/components/dashboard/PlanBadge';
import { fx } from '@/lib/edge';

export function PlanBadgeWrapper() {
  const [summary, setSummary] = useState<any>(null);

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
