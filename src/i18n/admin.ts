export const adminDict = {
  en: {
    Dashboard: 'Dashboard',
    Bookings: 'Bookings',
    Coaching: 'Coaching Offers',
    Blogs: 'Blogs',
    Events: 'Events',
    Secrets: 'Secrets',
    Pricing: 'Pricing & FX',
    Calendar: 'Calendar',
    AI: 'AI System',
    Express: 'Express Pay',
    Marketing: 'Marketing',
    Coupons: 'Coupons',
    Settings: 'Settings',
    Products: 'Products',
    ViewSite: 'View site'
  },
  'zh-CN': {
    Dashboard: '仪表盘',
    Bookings: '预约',
    Coaching: '教练服务',
    Blogs: '博客',
    Events: '活动',
    Secrets: '密钥',
    Pricing: '定价与汇率',
    Calendar: '日历',
    AI: 'AI系统',
    Express: '快速支付',
    Marketing: '营销',
    Coupons: '优惠券',
    Settings: '设置',
    Products: '产品',
    ViewSite: '查看网站'
  },
  'zh-TW': {
    Dashboard: '儀表板',
    Bookings: '預約',
    Coaching: '教練服務',
    Blogs: '部落格',
    Events: '活動',
    Secrets: '密鑰',
    Pricing: '定價與匯率',
    Calendar: '行事曆',
    AI: 'AI系統',
    Express: '快速支付',
    Marketing: '行銷',
    Coupons: '優惠券',
    Settings: '設定',
    Products: '產品',
    ViewSite: '查看網站'
  }
} as const;

export type AdminKey = keyof typeof adminDict['en'];

export function at(lang: 'en' | 'zh-CN' | 'zh-TW', key: AdminKey): string {
  return (adminDict as any)[lang][key] || (adminDict as any).en[key];
}
