import { functions } from '@/firebase/config';
import { httpsCallable, HttpsCallable } from 'firebase/functions';

// Define a more specific type for the payload
type CallablePayload<P> = P & {
  _method?: 'GET' | 'POST';
};

/**
 * A wrapper for Firebase Cloud Functions (callable) with improved type safety.
 *
 * @template T The expected return type of the function.
 * @template P The type of the payload to be sent to the function.
 * @param {string} name The name of the Cloud Function to call.
 * @param {'GET' | 'POST'} [method='POST'] The HTTP method to simulate.
 * @param {P} [payload] The data to send to the function.
 * @param {Record<string, string>} [params] URL parameters to be passed.
 * @returns {Promise<T>} A promise that resolves with the data returned by the function.
 * @throws Will throw an error if the function call fails.
 */
export async function fx<T = any, P = Record<string, any>>(
  name: string,
  method: 'GET' | 'POST' = 'POST',
  payload?: P,
  params?: Record<string, string>
): Promise<T> {
  try {
    const fn: HttpsCallable<CallablePayload<P | {}>, T> = httpsCallable<
      CallablePayload<P | {}>,
      T
    >(functions, name);

    const data: CallablePayload<P | {}> = {
      ...(payload || {}),
      ...(params || {}),
    };
    
    // For GET requests, method is often passed as a query param, but here we bundle it.
    if (method === 'GET') {
      data._method = 'GET';
    }

    const result = await fn(data);
    return result.data;
  } catch (error: any) {
    // It's good practice to type the error object
    console.error(
      `[Firebase Functions] Function '${name}' failed:`,
      error.message || error
    );
    throw new Error(`Function '${name}' invocation failed: ${error.message}`);
  }
}
