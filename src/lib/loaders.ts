import { endpoints } from './cn-env';

export function injectAnalytics() {
  if (endpoints.analytics === 'baidu-tongji') {
    const baiduId = import.meta.env.VITE_BAIDU_TONGJI_ID;
    if (baiduId) {
      const script = document.createElement('script');
      script.src = `https://hm.baidu.com/hm.js?${baiduId}`;
      document.head.appendChild(script);
    }
  }
  // Umami is loaded via index.html script tag
}

export function getBookingSrc(): string {
  return endpoints.booking === 'feishu'
    ? 'https://p3-feishu-sign.feishu.cn/share/base/form/YOUR_FEISHU_FORM_ID?from=cn'
    : 'https://cal.com/zhengrowth/discovery';
}
