import { useEffect, useState } from 'react';

interface AvailabilityOptions {
  tz?: string;
  days?: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

export function useAvailability(slug: string, opts?: AvailabilityOptions) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isActive = true;
    setLoading(true);

    const timezone = opts?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const days = opts?.days || 14;

    fetch('/api/cal/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, tz: timezone, days })
    })
      .then(r => r.json())
      .then(data => {
        if (!isActive) return;
        if (data.ok) {
          setSlots(data.slots || []);
          setError(undefined);
        } else {
          setError(data.error || 'Failed to fetch availability');
          setSlots([]);
        }
        setLoading(false);
      })
      .catch(err => {
        if (isActive) {
          setError(err.message);
          setSlots([]);
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [slug, opts?.days, opts?.tz]);

  return { slots, loading, error };
}
