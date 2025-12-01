interface Metric {
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  impressions?: number;
  clicks?: number;
  platform: string;
}

export function engagementScore(m: Metric): number {
  return (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
}

export function ctr(m: Metric): number | null {
  if (!m.impressions || !m.clicks) return null;
  return Math.round((m.clicks / m.impressions) * 1000) / 10; // %
}

export function platformLift(rows: Metric[], platform: string) {
  const r = rows.filter(x => x.platform === platform);
  const imp = r.reduce((a, b) => a + (b.impressions || 0), 0);
  const eng = r.reduce((a, b) => a + engagementScore(b), 0);
  return { 
    impressions: imp, 
    engagement: eng, 
    er: imp ? Math.round(eng * 1000 / imp) / 10 : 0 
  };
}

export function getTopPerformersByPlatform(metrics: Metric[], limit = 5): Record<string, Metric[]> {
  const topByPlatform = metrics.reduce((acc: Record<string, Metric[]>, m: Metric) => {
    (acc[m.platform] ||= []).push(m);
    return acc;
  }, {});

  for (const p in topByPlatform) {
    topByPlatform[p].sort((a: Metric, b: Metric) => 
      engagementScore(b) - engagementScore(a)
    );
    topByPlatform[p] = topByPlatform[p].slice(0, limit);
  }

  return topByPlatform;
}
