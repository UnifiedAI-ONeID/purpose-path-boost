
import { useState, ChangeEvent } from 'react';

export default function TzToggle({ startISO, endISO }: { startISO: string; endISO: string }) {
  const [tz, setTz] = useState<'America/Vancouver' | 'Asia/Shanghai'>('America/Vancouver');

  const fmt = (iso: string, tz: string) =>
    new Date(iso).toLocaleString(undefined, {
      timeZone: tz,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        className="select text-sm"
        value={tz}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setTz(e.target.value as 'America/Vancouver' | 'Asia/Shanghai')}
      >
        <option value="America/Vancouver">Vancouver</option>
        <option value="Asia/Shanghai">Shanghai</option>
      </select>
      <span className="text-muted">
        {fmt(startISO, tz)} → {fmt(endISO, tz)}
      </span>
    </div>
  );
}
