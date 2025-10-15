export function pickHashtags(base: string[], max: number) {
  const seen = new Set<string>();
  const clean = base.map(h => h.replace(/^#/, '').trim()).filter(Boolean);
  const out: string[] = [];
  for (const h of clean) {
    if (out.length >= max) break;
    const key = h.toLowerCase();
    if (!seen.has(key)) { 
      seen.add(key); 
      out.push('#' + h); 
    }
  }
  return out;
}

export function platformHashLimit(platform: string) {
  switch (platform) {
    case 'instagram': return 15; // safe, <30
    case 'x':         return 6;  // keep it short
    case 'linkedin':  return 8;
    case 'facebook':  return 8;
    default:          return 8;
  }
}

export const EMO = {
  leaf: '🍃',
  spark: '✨',
  chart: '📈',
  timer: '⏱️',
  link: '🔗',
};
