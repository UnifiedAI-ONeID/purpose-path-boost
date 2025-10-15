export const PLAT_SIZES = {
  linkedin:    { w: 1200, h: 627 },   // LinkedIn link share
  facebook:    { w: 1200, h: 630 },   // Facebook link share
  x:           { w: 1200, h: 675 },   // X (Twitter) card
  ig_square:   { w: 1080, h: 1080 },  // Instagram square post
  ig_portrait: { w: 1080, h: 1350 },  // Instagram portrait feed
  story:       { w: 1080, h: 1920 },  // Instagram Stories / Reels / YouTube Shorts
} as const;

export type PlatKey = keyof typeof PLAT_SIZES;

export const PLATFORM_DISPLAY_NAMES: Record<PlatKey, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  x: 'X/Twitter',
  ig_square: 'Instagram Square',
  ig_portrait: 'Instagram Portrait',
  story: 'Stories/Reels',
};
