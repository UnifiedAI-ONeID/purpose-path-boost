
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

export async function fx<T = any>(
  name: string,
  method: 'GET' | 'POST' = 'GET',
  payload?: any,
  params?: Record<string, string>
) {
  try {
    const fn = httpsCallable(functions, name);
    
    // Combine payload and params into a single object for the callable
    const data = {
      ...(payload || {}),
      ...(params || {}),
      _method: method
    };

    const result = await fn(data);
    return result.data as T;
  } catch (error) {
    console.error(`[Firebase Functions] Function '${name}' failed:`, error);
    throw error;
  }
}
