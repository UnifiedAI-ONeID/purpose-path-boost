/**
 * ZhenGrowth Global Animation Orchestrator
 * Uses the existing "home click" animation implementation.
 *
 * EXPECTED HOOKS (any ONE of these present is enough):
 *  a) window.ZGHomeClick?.play(): Promise<void> | void
 *  b) window.playHomeClick?: () => Promise<void> | void
 *  c) dynamic import of '../components/ui/HomeClickAnimation' exposing play()
 *
 * This file ensures: no double-play, respects reduce-motion, and exposes a single trigger().
 */
type PlayFn = () => Promise<void> | void;

declare global {
  interface Window {
    ZGHomeClick?: { play: PlayFn };
    playHomeClick?: PlayFn;
    __ZG_ANIM_LOCK__?: number;
  }
}

let cachedPlay: PlayFn | null = null;
let resolving = false;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  } catch {
    // Fails in non-browser env, e.g. SSR, which is fine.
    return false;
  }
}

/** Resolve the project's existing home click animation play() function */
async function resolvePlay(): Promise<PlayFn | null> {
  if (cachedPlay || resolving) return cachedPlay;
  resolving = true;
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.ZGHomeClick?.play === 'function') {
        cachedPlay = window.ZGHomeClick.play;
        return cachedPlay;
      }
      if (typeof window.playHomeClick === 'function') {
        cachedPlay = window.playHomeClick;
        return cachedPlay;
      }
    }
    // Optional dynamic import adapter
    try {
      const mod = await import('../components/ui/HomeClickAnimation');
      if (typeof mod.play === 'function') {
        cachedPlay = mod.play as PlayFn;
        return cachedPlay;
      }
    } catch {
        // Expected to fail if HomeClickAnimation is not used.
    }
    return null;
  } finally {
    resolving = false;
  }
}

/** Trigger animation once (debounced, motion-aware) */
export async function triggerHomeAnim(minIntervalMs = 900) {
  // reduce-motion users: skip heavy animation
  if (prefersReducedMotion()) return;

  const now = Date.now();
  const last = window.__ZG_ANIM_LOCK__ || 0;
  if (now - last < minIntervalMs) return; // debounce
  window.__ZG_ANIM_LOCK__ = now;

  const play = await resolvePlay();
  if (typeof play === 'function') {
    try { 
        await play(); 
    } catch {
        // Individual animation failures should not crash the app.
    }
  }
}
