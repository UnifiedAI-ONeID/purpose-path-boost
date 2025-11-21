/**
 * API Client for making calls to Cloud Run Backend
 * Replaces Supabase Edge Function calls
 */

import { auth } from '@/lib/firebase';

type ApiResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
};

/**
 * Invoke an API endpoint
 */
export async function invokeApi<T = any>(
  route: string, 
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  try {
    const url = route; // Assumes route starts with /api/
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add Auth Token if user is signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: options?.method || 'POST', // Default to POST for RPC-style, or whatever
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json();
    
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText, ...data };
    }

    return data;
  } catch (error: any) {
    console.error('API invocation error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Legacy fetch wrapper
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Ensure auth token
  const headers = new Headers(options?.headers);
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // If body is object, stringify it (fetch expects string or Buffer)
  let body = options?.body;
  if (body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
      body = JSON.stringify(body);
      headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
      ...options,
      headers,
      body
  });
}
