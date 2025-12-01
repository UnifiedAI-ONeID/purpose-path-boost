
interface InvokeApiOptions<T = any> extends RequestInit {
  body?: T;
}

export async function invokeApi<T = any>(
  endpoint: string, 
  options: InvokeApiOptions<T> = {}
) {
  const { body, headers, ...rest } = options;
  
  const headersInit: HeadersInit = {
    'Content-Type': 'application/json',
    ...(headers as any),
  };

  const config: RequestInit = {
    ...rest,
    headers: headersInit,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Handle relative URLs if needed, though fetch handles them by default relative to current origin.
  // If endpoint starts with /, it's relative to root.
  
  const response = await fetch(endpoint, config);

  if (!response.ok) {
    // Try to parse error message from JSON
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Ignore JSON parse error on error response
    }
    throw new Error(`API Error: ${response.status} - ${errorMessage}`);
  }

  // Return json if content-type is json, otherwise text
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}
