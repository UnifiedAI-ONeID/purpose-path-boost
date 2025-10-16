export type Dict = Record<string,string>;

export const dict: Record<'en'|'zh-CN'|'zh-TW', Dict> = {
  en:    { 
    book:'Book a session', 
    seeTimes:'See more times', 
    pay:'Pay', 
    freeCall:'Free Discovery Call', 
    priority:'Priority Session',
    apply:'Apply',
    coupon:'Coupon',
    processing:'Processing…',
    checking:'Checking availability…',
    nextSlots:'Next available slots'
  },
  'zh-CN':{ 
    book:'预约会谈',
    seeTimes:'查看更多时间',
    pay:'支付',
    freeCall:'免费初诊',
    priority:'优先咨询',
    apply:'应用',
    coupon:'优惠码',
    processing:'处理中…',
    checking:'检查可用性…',
    nextSlots:'下一个可用时段'
  },
  'zh-TW':{ 
    book:'預約會談',
    seeTimes:'查看更多時間',
    pay:'支付',
    freeCall:'免費初診',
    priority:'優先諮詢',
    apply:'應用',
    coupon:'優惠碼',
    processing:'處理中…',
    checking:'檢查可用性…',
    nextSlots:'下一個可用時段'
  }
};

export function t(lang:'en'|'zh-CN'|'zh-TW', key:string){ 
  return dict[lang]?.[key] || dict['en']?.[key] || key; 
}

export function pickLang<T extends Record<string,any>>(row:T, lang:'en'|'zh-CN'|'zh-TW'){
  const title = lang==='zh-CN' ? (row.title_zh_cn||row.title_en) : lang==='zh-TW'? (row.title_zh_tw||row.title_en) : row.title_en;
  const summary = lang==='zh-CN' ? (row.summary_zh_cn||row.summary_en) : lang==='zh-TW'? (row.summary_zh_tw||row.summary_en) : row.summary_en;
  const body = lang==='zh-CN' ? (row.body_html_zh_cn||row.body_html_en) : lang==='zh-TW'? (row.body_html_zh_tw||row.body_html_en) : row.body_html_en;
  return { title, summary, body };
}
