/**
 * HTTP utilities for Edge Functions
 * Provides timeout-aware fetch and helper functions
 */

/**
 * Fetch with timeout abort controller
 */
export async function strictFetch(
  url: string, 
  opts: RequestInit = {}, 
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...opts,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Standard JSON response helper
 */
export function jsonResponse(
  data: any, 
  status: number = 200, 
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...additionalHeaders
      }
    }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string, 
  status: number = 400
): Response {
  return jsonResponse({ ok: false, error }, status);
}

/**
 * Success response helper
 */
export function successResponse(data: any = {}): Response {
  return jsonResponse({ ok: true, ...data });
}
