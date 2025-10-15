export type Accent = { start: string; end: string; fg?: string; emoji?: string; wmOpacity?: number };

export const TAG_PALETTE: Record<string, Accent> = {
  mindset:      { start:'#0B3D3C', end:'#15706A', emoji:'🧠', wmOpacity:.12 },
  confidence:   { start:'#004E92', end:'#000428', emoji:'💪', wmOpacity:.10 },
  clarity:      { start:'#2E3192', end:'#1BFFFF', emoji:'🔎', wmOpacity:.10 },
  consistency:  { start:'#0F2027', end:'#203A43', emoji:'📆', wmOpacity:.10 },
  habits:       { start:'#4CA1AF', end:'#2C3E50', emoji:'🔁', wmOpacity:.12 },
  leadership:   { start:'#8E2DE2', end:'#4A00E0', emoji:'👑', wmOpacity:.10 },
  career:       { start:'#11998E', end:'#38EF7D', emoji:'💼', wmOpacity:.10 },
  relationships:{ start:'#FF512F', end:'#DD2476', emoji:'💬', wmOpacity:.12 },
  wellness:     { start:'#F7971E', end:'#FFD200', emoji:'🌿', wmOpacity:.12 },
  spirituality: { start:'#5A3F37', end:'#2C7744', emoji:'✨', wmOpacity:.10 },
  money:        { start:'#56ab2f', end:'#a8e063', emoji:'💰', wmOpacity:.10 },
  productivity: { start:'#1D2B64', end:'#F8CDDA', emoji:'⏱️', wmOpacity:.10 },

  // Chinese aliases
  '自信':       { start:'#004E92', end:'#000428', emoji:'💪', wmOpacity:.10 },
  '清晰':       { start:'#2E3192', end:'#1BFFFF', emoji:'🔎', wmOpacity:.10 },
  '一致性':     { start:'#0F2027', end:'#203A43', emoji:'📆', wmOpacity:.10 },
  '職涯':       { start:'#11998E', end:'#38EF7D', emoji:'💼', wmOpacity:.10 },
  '關係':       { start:'#FF512F', end:'#DD2476', emoji:'💬', wmOpacity:.12 },
};

// Fallback if tag not found
export const DEFAULT_ACCENT: Accent = { start:'#0B3D3C', end:'#15706A', emoji:'🍃', wmOpacity:.10 };

export function pickAccent(primaryTag?: string): Accent {
  if (!primaryTag) return DEFAULT_ACCENT;
  const key = primaryTag.toLowerCase().trim();
  // try exact, then strip non-letters (handles zh/emoji combos), then fallback
  return TAG_PALETTE[key] || TAG_PALETTE[strip(key)] || DEFAULT_ACCENT;
}

function strip(s: string) {
  return s.replace(/[^\p{L}\p{N}]+/gu, '');
}
