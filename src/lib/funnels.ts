import { supabase } from '@/integrations/supabase/client';

/**
 * Funnel system for upselling after lesson completion
 */

export interface Funnel {
  slug: string;
  name: string;
  target_plan_slug: string;
  config: {
    copy?: {
      headline?: string;
      sub?: string;
    };
    cta?: string;
  };
}

/**
 * Check if a lesson has any funnel triggers attached
 * @param lessonSlug The slug of the completed lesson
 * @returns Array of funnels to display, or empty array if none
 */
export async function getFunnelsForLesson(lessonSlug: string): Promise<Funnel[]> {
  try {
    // Get funnel slugs for this lesson
    const { data: triggers, error: triggerError } = await supabase
      .from('lesson_funnel_triggers')
      .select('funnel_slug')
      .eq('lesson_slug', lessonSlug);

    if (triggerError || !triggers || triggers.length === 0) {
      return [];
    }

    const funnelSlugs = triggers.map(t => t.funnel_slug);

    // Get funnel details
    const { data: funnels, error: funnelError } = await supabase
      .from('funnels')
      .select('slug, name, target_plan_slug, config')
      .in('slug', funnelSlugs);

    if (funnelError || !funnels) {
      return [];
    }

    return funnels as Funnel[];
  } catch (err) {
    console.error('[getFunnelsForLesson] Error:', err);
    return [];
  }
}

/**
 * Get the primary funnel for a lesson (first one if multiple exist)
 * @param lessonSlug The slug of the completed lesson
 * @returns The funnel to display, or null if none
 */
export async function getPrimaryFunnelForLesson(lessonSlug: string): Promise<Funnel | null> {
  const funnels = await getFunnelsForLesson(lessonSlug);
  return funnels.length > 0 ? funnels[0] : null;
}

/**
 * Example usage in a lesson completion handler:
 * 
 * ```typescript
 * import { getPrimaryFunnelForLesson } from '@/lib/funnels';
 * 
 * async function handleLessonComplete(lessonSlug: string) {
 *   // Mark lesson as complete...
 *   
 *   // Check for funnel
 *   const funnel = await getPrimaryFunnelForLesson(lessonSlug);
 *   
 *   if (funnel) {
 *     showUpsellModal({
 *       title: funnel.config?.copy?.headline || 'Unlock More Content',
 *       subtitle: funnel.config?.copy?.sub || 'Upgrade to continue your journey',
 *       ctaHref: funnel.config?.cta || `/pricing?highlight=${funnel.target_plan_slug}`
 *     });
 *   }
 * }
 * ```
 */
