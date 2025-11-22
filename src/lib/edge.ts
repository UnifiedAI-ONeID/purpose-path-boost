/**
 * Edge Function caller utility
 * Migrated to Firebase Cloud Functions (Callable)
 */
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

export async function fx<T = any>(
  name: string,
  method: 'GET' | 'POST' = 'GET',
  payload?: any,
  params?: Record<string, string>
) {
  // console.warn(`[MIGRATION] fx('${name}') called. Redirecting to Firebase Functions.`);
  
  try {
    const fn = httpsCallable(functions, name);
    
    // Combine payload and params into a single object for the callable
    const data = {
      ...(payload || {}),
      ...(params || {}),
      _method: method // Pass original method context if needed by the function
    };

    const result = await fn(data);
    return result.data as T;
  } catch (error) {
    console.error(`[Edge] Function '${name}' failed:`, error);
    throw error;
  }
}
