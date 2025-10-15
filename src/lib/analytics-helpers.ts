export function engagementScore(m: any) {
  return (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
}

export function ctr(m: any) {
  if (!m.impressions || !m.clicks) return null;
  return Math.round((m.clicks / m.impressions) * 1000) / 10; // %
}

export function platformLift(rows: any[], platform: string) {
  const r = rows.filter(x => x.platform === platform);
  const imp = r.reduce((a, b) => a + (b.impressions || 0), 0);
  const eng = r.reduce((a, b) => a + engagementScore(b), 0);
  return { 
    impressions: imp, 
    engagement: eng, 
    er: imp ? Math.round(eng * 1000 / imp) / 10 : 0 
  };
}

export function getTopPerformersByPlatform(metrics: any[], limit: number = 5) {
  const topByPlatform = metrics.reduce((acc: any, m: any) => {
    (acc[m.platform] ||= []).push(m);
    return acc;
  }, {});

  for (const p in topByPlatform) {
    topByPlatform[p].sort((a: any, b: any) => 
      engagementScore(b) - engagementScore(a)
    );
    topByPlatform[p] = topByPlatform[p].slice(0, limit);
  }

  return topByPlatform;
}
