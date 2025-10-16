export type RegionHint = 'zh-CN' | 'zh-TW' | 'en';

export function inferRegionHint(): RegionHint {
  // Primary signals (all local-only)
  const nav = (navigator.language || 'en').toLowerCase();
  const langs = (navigator.languages || []).map(l => l.toLowerCase());
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();

  // If the user already speaks zh-TW
  if (nav.startsWith('zh-tw') || nav.startsWith('zh-hk') || langs.some(l => l.startsWith('zh-tw') || l.startsWith('zh-hk'))) {
    return 'zh-TW';
  }
  
  // If the user already speaks zh-CN
  if (nav.startsWith('zh') || langs.some(l => l.startsWith('zh'))) {
    return 'zh-CN';
  }

  // Timezone heuristics
  if (tz.includes('hong_kong') || tz.includes('taipei') || tz.includes('macau')) {
    return 'zh-TW';
  }
  
  if (tz.includes('shanghai') || tz.includes('chongqing') || tz.includes('urumqi') || tz.includes('harbin')) {
    return 'zh-CN';
  }

  return 'en';
}
