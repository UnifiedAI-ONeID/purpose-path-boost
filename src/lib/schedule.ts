// Schedule utility: parse time windows & compute next send times by timezone
// Windows format: "Tue 12:00-14:00", "Thu 19:00-21:00", "Sun 17:00-19:00"
// Schedules at START of window, next occurrence within 7 days.

const DOW = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 } as const;

export type Region = 'Asia/Shanghai'|'America/Vancouver';
export type Platform = 'linkedin'|'facebook'|'instagram'|'x';

export function nextSendFromWindow(windowStr: string, region: Region, now = new Date()): Date | null {
  // Parse "Tue 12:00-14:00"
  const m = windowStr.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  
  const dow = DOW[m[1] as keyof typeof DOW];
  const h = parseInt(m[2], 10);
  const min = parseInt(m[3], 10);

  // Create date in target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: region, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const nowInTz = new Date(
    parseInt(parts.find(p => p.type === 'year')!.value),
    parseInt(parts.find(p => p.type === 'month')!.value) - 1,
    parseInt(parts.find(p => p.type === 'day')!.value),
    parseInt(parts.find(p => p.type === 'hour')!.value),
    parseInt(parts.find(p => p.type === 'minute')!.value),
    parseInt(parts.find(p => p.type === 'second')!.value)
  );

  const currDow = nowInTz.getDay();
  const currH = nowInTz.getHours();
  const currMin = nowInTz.getMinutes();

  // Calculate days until target dow
  let deltaDays = (dow - currDow + 7) % 7;
  
  // If same day but time has passed, schedule for next week
  if (deltaDays === 0 && (currH > h || (currH === h && currMin >= min))) {
    deltaDays = 7;
  }

  // Build target date in timezone
  const target = new Date(nowInTz);
  target.setDate(target.getDate() + deltaDays);
  target.setHours(h, min, 0, 0);

  // Convert back to UTC by getting timestamp difference
  const targetStr = target.toLocaleString('en-CA', { timeZone: region, hour12: false });
  const targetUTC = new Date(targetStr + ' UTC');
  
  // Calculate offset
  const tzOffset = target.getTime() - new Date(targetStr).getTime();
  return new Date(target.getTime() - tzOffset);
}

export function platformRegion(p: Platform): Region {
  // Default: LinkedIn/X skew to Vancouver; Instagram/Facebook to Shanghai for CN primetime
  if (p === 'linkedin' || p === 'x') return 'America/Vancouver';
  return 'Asia/Shanghai';
}

export function pickSchedules(
  windows: { ['Asia/Shanghai']: string[]; ['America/Vancouver']: string[] },
  platforms: Platform[],
  now = new Date()
): Record<Platform, Date | null> {
  const out: Record<Platform, Date | null> = { 
    linkedin: null, 
    facebook: null, 
    instagram: null, 
    x: null 
  };
  
  for (const p of platforms) {
    const region = platformRegion(p);
    const list = windows[region] || [];
    
    // Try each suggested window in order until we find a valid next datetime
    let dt: Date | null = null;
    for (const w of list) {
      dt = nextSendFromWindow(w, region, now);
      if (dt) break;
    }
    out[p] = dt;
  }
  
  return out;
}
