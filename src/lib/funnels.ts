import { db } from '@/firebase/config';
import { collection, query, where, getDocs, CollectionReference } from 'firebase/firestore';

/**
 * Represents a sales funnel, typically used for upselling after a user action.
 */
export interface Funnel {
  slug: string;
  name: string;
  target_plan_slug: string;
  /** A list of lesson slugs that trigger this funnel. */
  triggers: string[];
  config: {
    copy?: {
      headline?: string;
      sub?: string;
    };
    cta?: string;
  };
}

// Per the schema, funnels are stored in a subcollection.
// Path: /config/funnels/funnels
const FUNNELS_COLLECTION_PATH = 'config/funnels/funnels';
const funnelsCollection = collection(db, FUNNELS_COLLECTION_PATH) as CollectionReference<Funnel>;

/**
 * Retrieves all funnels triggered by a specific lesson.
 * @param lessonSlug The slug of the lesson that was just completed.
 * @returns A promise that resolves to an array of Funnel objects, or an empty array if none are found or an error occurs.
 */
export async function getFunnelsForLesson(lessonSlug: string): Promise<Funnel[]> {
  if (!lessonSlug) {
    console.warn('[getFunnelsForLesson] lessonSlug is empty or null.');
    return [];
  }

  try {
    const q = query(
      funnelsCollection, 
      where('triggers', 'array-contains', lessonSlug)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    // Map Firestore documents to Funnel objects
    return snapshot.docs.map(doc => ({
      slug: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[getFunnelsForLesson] Error fetching funnels for lesson "${lessonSlug}":`, errorMessage);
    return [];
  }
}

/**
 * Retrieves the primary funnel for a given lesson.
 * If multiple funnels are triggered, this function returns the first one.
 * @param lessonSlug The slug of the completed lesson.
 * @returns A promise that resolves to the first matching Funnel, or null if no funnels are found.
 */
export async function getPrimaryFunnelForLesson(lessonSlug: string): Promise<Funnel | null> {
  const funnels = await getFunnelsForLesson(lessonSlug);
  return funnels.length > 0 ? funnels[0] : null;
}
