import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
    // Query 'funnels' collection where 'triggers' array-contains lessonSlug
    const funnelsRef = collection(db, 'config', 'funnels', 'funnels'); // Assuming nested structure from SCHEMA
    // Or maybe just top level /funnels if not strictly following the yaml structure yet.
    // The YAML said:
    // config:
    //   documents:
    //     funnels:
    //       subcollection: funnels
    
    // Let's try simple top-level query for 'funnels' collection for now, assuming migration put it there or under config/funnels/funnels
    // Since I haven't run migration, I should write code that WILL work with the migration target.
    // Schema says: /config/{configId}/funnels -> so /config/funnels/funnels is the path.
    
    const q = query(
      collection(db, 'config', 'funnels', 'funnels'), 
      where('triggers', 'array-contains', lessonSlug)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(d => ({ slug: d.id, ...d.data() } as Funnel));

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
