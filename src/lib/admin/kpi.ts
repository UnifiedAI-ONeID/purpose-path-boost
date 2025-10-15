// KPI calculation utilities for admin dashboard

type Lead = {
  stage?: string;
  source?: string;
};

export function totals(rows: Lead[]) {
  const total = rows.length;
  const discovery = rows.filter(r => r.source === 'book').length;
  const won = rows.filter(r => r.stage === 'won').length;
  const leadToClient = total ? Math.round((won / total) * 100) : 0;
  
  return {
    total,
    discovery,
    won,
    leadToClient // compare to 5–15% target
  };
}
