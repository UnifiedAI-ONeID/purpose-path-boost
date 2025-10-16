export type Lang = 'en' | 'zh-CN' | 'zh-TW';

/**
 * Extract localized fields from a database row based on language preference
 */
export function pickFields<T extends Record<string, any>>(row: T, lang: Lang) {
  const title = lang === 'zh-CN' 
    ? (row.title_zh_cn ?? row.title_en)
    : lang === 'zh-TW' 
    ? (row.title_zh_tw ?? row.title_en)
    : row.title_en;

  const summary = lang === 'zh-CN'
    ? (row.summary_zh_cn ?? row.summary_en)
    : lang === 'zh-TW'
    ? (row.summary_zh_tw ?? row.summary_en)
    : row.summary_en;

  const body = lang === 'zh-CN'
    ? (row.body_html_zh_cn ?? row.body_html_en)
    : lang === 'zh-TW'
    ? (row.body_html_zh_tw ?? row.body_html_en)
    : row.body_html_en;

  return { title, summary, body };
}

/**
 * Detect language from request (query param > body > Accept-Language header)
 */
export function getLang(req: any): Lang {
  // Check query/body params first
  const q = (req.query?.lang || req.body?.lang || '').toString();
  if (q === 'zh-CN' || q === 'zh-TW' || q === 'en') return q as Lang;
  
  // Fallback to Accept-Language header
  const al = (req.headers['accept-language'] || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}
