import { invokeApi } from './api-client';

let cache: any = null;

export async function getIntegrations() {
  if (cache) return cache;
  
  const { data } = await invokeApi('/api/integrations/public');
  cache = data;
  
  return cache;
}

export function clearIntegrationsCache() {
  cache = null;
}
