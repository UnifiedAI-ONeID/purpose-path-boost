// Detect if we're in China environment
export const isCN =
  location.hostname.endsWith('cn.zhengrowth.com') ||
  (window as any).__EDGE_COUNTRY__ === 'CN';

export const endpoints = {
  analytics: isCN ? 'baidu-tongji' : 'umami',
  booking: isCN ? 'feishu' : 'cal',
  maps: isCN ? 'amap' : 'google',
};
