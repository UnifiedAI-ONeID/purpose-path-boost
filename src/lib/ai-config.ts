import { Genkit } from './genkit-ai';

export const AI = {
  ENABLE: true,
  TIMEOUT: 6000,
  CACHE_TTL: 900,
  STRICT: true,
  CN_DOMAINS: ['zhengrowth.cn', 'cn.zhengrowth.com'],
  isCN: (host?: string, country?: string) =>
    (country || '').toUpperCase() === 'CN' || 
    !!(host && AI.CN_DOMAINS.some(d => host.endsWith(d))),
  genkit: new Genkit(),
};

export const EDGE_COUNTRY_HEADER = 'x-edge-country';
