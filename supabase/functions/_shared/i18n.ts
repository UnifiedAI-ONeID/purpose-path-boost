/**
 * Internationalization utilities for Edge Functions
 * Handles language detection and localized field selection
 */

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
 * Detect language from request body or headers
 */
export async function getLang(req: Request): Promise<Lang> {
  try {
    // Try to get from request body
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await req.json();
      const lang = body?.lang || body?.language || body?.locale;
      if (lang === 'zh-CN' || lang === 'zh-TW' || lang === 'en') {
        return lang as Lang;
      }
    }
  } catch (e) {
    // Body parsing failed, continue to header check
  }

  // Fallback to Accept-Language header
  const al = (req.headers.get('accept-language') || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}

/**
 * Get language from body object (for already parsed requests)
 */
export function getLangFromBody(body: any): Lang {
  const lang = body?.lang || body?.language || body?.locale;
  if (lang === 'zh-CN' || lang === 'zh-TW' || lang === 'en') {
    return lang as Lang;
  }
  return 'en';
}
