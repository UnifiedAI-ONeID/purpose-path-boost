import { useMemo } from 'react';

type WeekData = {
  week_start: string;
  leads: number;
  booked: number;
  won: number;
};

export function useRolling(rows: WeekData[]) {
  const last7 = rows.slice(-1); // this week only
  const last28 = rows.slice(-4); // last 4 weeks
  
  const sum = (arr: any[], k: string) => arr.reduce((a, b) => a + (b[k] || 0), 0);
  
  const l7 = {
    leads: sum(last7, 'leads'),
    booked: sum(last7, 'booked'),
    won: sum(last7, 'won')
  };
  
  const l28 = {
    leads: sum(last28, 'leads'),
    booked: sum(last28, 'booked'),
    won: sum(last28, 'won')
  };
  
  return useMemo(() => ({ l7, l28 }), [rows]);
}
