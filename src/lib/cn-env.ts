// Environment detection for China-specific features

const getHostname = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return '';
};

const getEdgeCountry = (): string | undefined => {
  if (typeof window !== 'undefined' && (window as any).__EDGE_COUNTRY__) {
    return (window as any).__EDGE_COUNTRY__;
  }
  return undefined;
};

const hostname = getHostname();
const edgeCountry = getEdgeCountry();

export const isCN = hostname.endsWith('.cn') 
  || hostname.endsWith('cn.zhengrowth.com') 
  || edgeCountry === 'CN';

const getEndpoints = (isCN: boolean) => ({
  analytics: isCN ? 'baidu-tongji' : 'umami',
  booking: isCN ? 'feishu' : 'cal',
  maps: isCN ? 'amap' : 'google',
});

export const environment = {
  isCN,
  endpoints: getEndpoints(isCN),
};
