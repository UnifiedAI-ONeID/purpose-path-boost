export type Accent = { start: string; end: string; fg?: string };

export const TAG_PALETTE: Record<string, Accent> = {
  // Mindset & confidence
  mindset:     { start: '#0B3D3C', end: '#15706A' },          // jade → teal (default)
  confidence:  { start: '#004E92', end: '#000428' },          // deep blue gradient
  clarity:     { start: '#2E3192', end: '#1BFFFF' },          // indigo → aqua
  consistency: { start: '#0F2027', end: '#203A43' },          // charcoal → steel
  habits:      { start: '#4CA1AF', end: '#2C3E50' },
  leadership:  { start: '#8E2DE2', end: '#4A00E0' },
  career:      { start: '#11998E', end: '#38EF7D' },          // emeralds
  relationships:{ start: '#FF512F', end: '#DD2476' },         // coral → magenta
  wellness:    { start: '#F7971E', end: '#FFD200' },          // amber
  spirituality:{ start: '#5A3F37', end: '#2C7744' },          // earth → forest
  money:       { start: '#56ab2f', end: '#a8e063' },          // growth green
  productivity:{ start: '#1D2B64', end: '#F8CDDA' },          // corporate dusk
  // aliases (map Chinese tags to same keys)
  '自信':      { start: '#004E92', end: '#000428' },
  '清晰':      { start: '#2E3192', end: '#1BFFFF' },
  '一致性':    { start: '#0F2027', end: '#203A43' },
  '職涯':      { start: '#11998E', end: '#38EF7D' },
  '關係':      { start: '#FF512F', end: '#DD2476' },
};

// Fallback if tag not found
export const DEFAULT_ACCENT: Accent = { start: '#0B3D3C', end: '#15706A' };

export function pickAccent(primaryTag?: string): Accent {
  if (!primaryTag) return DEFAULT_ACCENT;
  const key = primaryTag.toLowerCase().trim();
  // try exact, then strip non-letters (handles zh/emoji combos), then fallback
  return TAG_PALETTE[key] || TAG_PALETTE[strip(key)] || DEFAULT_ACCENT;
}

function strip(s: string) {
  return s.replace(/[^\p{L}\p{N}]+/gu, '');
}
