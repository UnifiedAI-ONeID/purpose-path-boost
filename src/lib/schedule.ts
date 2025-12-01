/**
 * @file This file provides utilities for scheduling tasks based on time windows and timezones.
 * It's designed to calculate the next occurrence of an event within a given weekly schedule.
 */

// --- Constants and Type Definitions ---

const DOW_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as const;
type DayOfWeek = keyof typeof DOW_MAP;

export type Timezone = 'Asia/Shanghai' | 'America/Vancouver';
export type Platform = 'linkedin' | 'facebook' | 'instagram' | 'x';

interface ParsedWindow {
  dow: number;
  hour: number;
  minute: number;
}

// --- Core Scheduling Logic ---

/**
 * Parses a time window string (e.g., "Tue 12:00-14:00") into a structured object.
 * @param {string} windowStr - The time window string.
 * @returns {ParsedWindow | null} A parsed window object or null if parsing fails.
 */
function parseTimeWindow(windowStr: string): ParsedWindow | null {
  const match = windowStr.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2}):(\d{2})/);
  if (!match) {
    console.warn(`[Schedule] Invalid time window format: "${windowStr}"`);
    return null;
  }
  return {
    dow: DOW_MAP[match[1] as DayOfWeek],
    hour: parseInt(match[2], 10),
    minute: parseInt(match[3], 10),
  };
}

/**
 * Calculates the next send date and time based on a time window and timezone.
 * @param {string} windowStr - The time window string (e.g., "Tue 12:00-14:00").
 * @param {Timezone} timezone - The target timezone.
 * @param {Date} [now=new Date()] - The current date, for testing purposes.
 * @returns {Date | null} The next send date in UTC, or null if the window is invalid.
 */
export function nextSendFromWindow(windowStr: string, timezone: Timezone, now = new Date()): Date | null {
  const parsed = parseTimeWindow(windowStr);
  if (!parsed) return null;

  const { dow, hour, minute } = parsed;

  // Use Intl.DateTimeFormat to correctly handle timezone conversions and DST.
  // This is more reliable than manual offset calculations.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)!.value, 10);
  
  const nowInTz = new Date(Date.UTC(
    getPart('year'), getPart('month') - 1, getPart('day'),
    getPart('hour'), getPart('minute'), getPart('second')
  ));
  
  const currentDow = nowInTz.getUTCDay();
  
  let daysToAdd = (dow - currentDow + 7) % 7;
  if (daysToAdd === 0) {
    // If it's the same day, check if the time has already passed.
    const currentTimeInMinutes = nowInTz.getUTCHours() * 60 + nowInTz.getUTCMinutes();
    const targetTimeInMinutes = hour * 60 + minute;
    if (currentTimeInMinutes >= targetTimeInMinutes) {
      daysToAdd = 7; // Schedule for the same day next week.
    }
  }

  const targetDate = new Date(nowInTz);
  targetDate.setUTCDate(targetDate.getUTCDate() + daysToAdd);
  targetDate.setUTCHours(hour, minute, 0, 0);

  // The `targetDate` is now a UTC date that represents the correct local time in the target timezone.
  // We need to convert this "local time as UTC" back to an actual UTC timestamp.
  const year = targetDate.getUTCFullYear();
  const month = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getUTCDate().toString().padStart(2, '0');
  const h = targetDate.getUTCHours().toString().padStart(2, '0');
  const m = targetDate.getUTCMinutes().toString().padStart(2, '0');
  
  // Create an ISO-like string representing the *local time* in the target timezone.
  const localTimeStr = `${year}-${month}-${day}T${h}:${m}:00`;
  
  // Use the `timeZone` property of the Date constructor (supported in modern environments)
  // to get the correct UTC timestamp.
  return new Date(`${localTimeStr}[${timezone}]`);
}

/**
 * Determines the primary region for a given social media platform.
 * @param {Platform} p - The platform.
 * @returns {Timezone} The recommended timezone for that platform.
 */
export function platformRegion(p: Platform): Timezone {
  // LinkedIn/X for North American audience, others for Asian audience primetime.
  return (p === 'linkedin' || p === 'x') ? 'America/Vancouver' : 'Asia/Shanghai';
}

/**
 * Picks the best upcoming schedule for each specified platform.
 * @param {Record<Timezone, string[]>} windows - The available time windows for each region.
 * @param {Platform[]} platforms - The platforms to schedule for.
 * @param {Date} [now=new Date()] - The current date, for testing purposes.
 * @returns {Record<Platform, Date | null>} A map of platforms to their next scheduled send time.
 */
export function pickSchedules(
  windows: Record<Timezone, string[]>,
  platforms: Platform[],
  now = new Date()
): Record<Platform, Date | null> {
  const schedules: Partial<Record<Platform, Date | null>> = {};
  
  for (const p of platforms) {
    const region = platformRegion(p);
    const availableWindows = windows[region] || [];
    
    const nextDates = availableWindows
      .map(w => nextSendFromWindow(w, region, now))
      .filter((d): d is Date => d !== null) // Filter out nulls and type guard
      .sort((a, b) => a.getTime() - b.getTime()); // Sort to find the earliest

    schedules[p] = nextDates.length > 0 ? nextDates[0] : null;
  }
  
  return schedules as Record<Platform, Date | null>;
}
