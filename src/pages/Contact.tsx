import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import ExpressPaySheet from '@/components/mobile/ExpressPaySheet';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { fx } from '@/lib/edge';
import { toast } from 'sonner';
import { invokeApi } from '@/lib/api-client';

type Lang = 'en'|'zh-CN'|'zh-TW';

const translations = {
  en: {
    title: 'Contact ZhenGrowth',
    subtitle: 'Clarity. Confidence. Consistency. Tell us where you are stuck - get a reply within 24 hours.',
    bookBtn: 'Book a Free Discovery Call',
    contact: 'How to reach us',
    form: 'Tell us more',
    name: 'Your name',
    email: 'Email',
    phone: 'Phone (optional)',
    wechat: 'WeChat ID (optional)',
    whatsapp: 'WhatsApp (optional)',
    topic: 'What do you need help with?',
    budget: 'Monthly budget (optional)',
    langPref: 'Preferred language',
    channel: 'Preferred channel',
    message: 'What is happening? (the more context, the better)',
    consent: 'I agree to the Privacy Policy and to be contacted about my inquiry.',
    submit: 'Send message',
    success: 'Thanks! We will reply within 24 hours (often sooner).',
    fail: 'Something went wrong. Please email hello@zhengrowth.com.',
    hours: 'Hours',
    hoursTxt: 'Mon-Fri 9:00-17:00 (America/Vancouver) • Tue-Sat 10:00-18:00 (Asia/Shanghai)',
    contactInfo: 'Email: hello@zhengrowth.com · WeChat: ZhenGrowth',
    priority: '⚡ Priority Lane - 30-min Express Consult',
    priorityDesc: '48-hour response SLA · WeChat Pay/Alipay/cards · Get an action plan fast',
    priorityBtn: 'Pay & Get Priority',
  },
  'zh-CN': {
    title: '联系 ZhenGrowth',
    subtitle: '清晰 自信 一致 告诉我们你的卡点 24小时内回复',
    bookBtn: '预约免费探索通话',
    contact: '联系我们',
    form: '告诉我们更多',
    name: '你的姓名',
    email: '电子邮箱',
    phone: '手机（可选）',
    wechat: '微信号（可选）',
    whatsapp: 'WhatsApp（可选）',
    topic: '你想改善的方向',
    budget: '月预算（可选）',
    langPref: '偏好语言',
    channel: '偏好沟通方式',
    message: '你的情况（越具体越好）',
    consent: '我同意隐私政策并允许就此咨询与我联系',
    submit: '发送消息',
    success: '谢谢！我们会在24小时内回复（通常更快）',
    fail: '发送失败 请直接邮件 hello@zhengrowth.com',
    hours: '工作时间',
    hoursTxt: '周一至周五 9:00-17:00（温哥华）周二至周六 10:00-18:00（上海）',
    contactInfo: '邮箱：hello@zhengrowth.com 微信：ZhenGrowth',
    priority: '⚡ 优先通道 30分钟快速咨询',
    priorityDesc: '48小时响应保证 微信支付/支付宝/银行卡 快速获得行动方案',
    priorityBtn: '支付并获取优先服务',
  },
  'zh-TW': {
    title: '联络 ZhenGrowth',
    subtitle: '清晰 自信 一致 告诉我们你的卡点 24小时内回复',
    bookBtn: '预约免费探索通话',
    contact: '联络我们',
    form: '告诉我们更多',
    name: '你的姓名',
    email: '电子邮箱',
    phone: '手机（可选）',
    wechat: '微信号（可选）',
    whatsapp: 'WhatsApp（可选）',
    topic: '你想改善的方向',
    budget: '月预算（可选）',
    langPref: '偏好语言',
    channel: '偏好沟通方式',
    message: '你的情况（越具体越好）',
    consent: '我同意隐私政策并允许就此咨询与我联系',
    submit: '发送讯息',
    success: '谢谢！我们将在24小时内回复（通常更快）',
    fail: '发送失败 请直接邮件 hello@zhengrowth.com',
    hours: '服务时间',
    hoursTxt: '周一至周五 9:00-17:00（温哥华）周二至周六 10:00-18:00（上海）',
    contactInfo: '邮箱：hello@zhengrowth.com 微信：ZhenGrowth',
    priority: '⚡ 优先通道 30分钟快速咨询',
    priorityDesc: '48小时响应保证 微信支付/支付宝/银行卡 快速获得行动方案',
    priorityBtn: '支付并获取优先服务',
  }
};

const topicOptions = [
  { key:'clarity', en:'Clarity & Direction', cn:'清晰与方向' },
  { key:'confidence', en:'Confidence & Mindset', cn:'自信与心态' },
  { key:'career', en:'Career / Leadership', cn:'职业 / 领导力' },
  { key:'habits', en:'Habits & Consistency', cn:'习惯与一致性' },
  { key:'relationships', en:'Relationships & Communication', cn:'关系与沟通' },
  { key:'wellness', en:'Stress & Wellness', cn:'压力与身心' },
  { key:'other', en:'Other', cn:'其他' },
];

const budgetOptions = [
  { key:'<200', en:'Under $200', cn:'低于 $200' },
  { key:'200-500', en:'$200-$500', cn:'$200-$500' },
  { key:'500-1000', en:'$500-$1,000', cn:'$500-$1,000' },
  { key:'>1000', en:'$1,000+', cn:'$1,000+' },
];

const langOptions = [
  { key:'en', en:'English', cn:'英语' },
  { key:'zh-CN', en:'Chinese (Simplified)', cn:'中文（简体）' },
  { key:'zh-TW', en:'Chinese (Traditional)', cn:'中文（繁体）' },
];

const channelOptions = [
  { key:'email', en:'Email', cn:'邮箱' },
  { key:'wechat', en:'WeChat', cn:'微信' },
  { key:'whatsapp', en:'WhatsApp', cn:'WhatsApp' },
  { key:'phone', en:'Phone', cn:'电话' },
];

function CurrencySelect({ value, onChange }:{ value:string; onChange:(v:string)=>void }){
  return (
    <select className="select w-24" value={value} onChange={e=>onChange(e.target.value)}>
      {['USD','CAD','EUR','GBP','HKD','SGD','CNY'].map(c=> <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

export default function ContactPage(){
  const isMobile = useIsMobile();
  const [lang,setLang]=useState<Lang>('en');
  const [sent,setSent]=useState<'idle'|'ok'|'err'>('idle');
  const [busy,setBusy]=useState(false);
  const [cur,setCur]=useState('USD');
  const [expressBusy,setExpressBusy]=useState(false);
  const [expressPrice,setExpressPrice]=useState<{amount_cents:number,currency:string}|null>(null);
  const [showExpressSheet, setShowExpressSheet] = useState(false);

  const t = translations[lang];

  useEffect(()=>{
    const n = navigator.language || '';
    if (n.startsWith('zh-TW')) setLang('zh-TW');
    else if (n.startsWith('zh')) setLang('zh-CN');

    loadExpressPrice('USD');
  },[]);

  async function loadExpressPrice(currency:string){
    try {
      const data = await fx('api-express-price', 'POST', { currency });
      if (data?.ok) {
        setExpressPrice({ amount_cents: data.amount_cents, currency: data.currency });
      }
    } catch (e) {
      console.error('Failed to load express price', e);
    }
  }

  const topics = useMemo(()=>topicOptions.map(o=>({ key:o.key, label: lang==='en'?o.en:o.cn })),[lang]);
  const budgets = useMemo(()=>budgetOptions.map(o=>({ key:o.key, label: lang==='en'?o.en:o.cn })),[lang]);
  const langs = useMemo(()=>langOptions.map(o=>({ key:o.key as Lang, label: lang==='en'?o.en:o.cn })),[lang]);
  const channels = useMemo(()=>channelOptions.map(o=>({ key:o.key, label: lang==='en'?o.en:o.cn })),[lang]);

  async function submit(){
    setBusy(true);
    try {
      const payload = {
        name: (document.getElementById('name') as HTMLInputElement).value.trim(),
        email: (document.getElementById('email') as HTMLInputElement).value.trim(),
        phone: (document.getElementById('phone') as HTMLInputElement).value.trim(),
        wechat: (document.getElementById('wechat') as HTMLInputElement).value.trim(),
        whatsapp: (document.getElementById('whatsapp') as HTMLInputElement).value.trim(),
        topic: (document.getElementById('topic') as HTMLSelectElement).value,
        budget: (document.getElementById('budget') as HTMLSelectElement).value,
        lang_pref: (document.getElementById('langpref') as HTMLSelectElement).value,
        channel_pref: (document.getElementById('channel') as HTMLSelectElement).value,
        message: (document.getElementById('message') as HTMLTextAreaElement).value.trim(),
        consent: (document.getElementById('consent') as HTMLInputElement).checked,
        honey: (document.getElementById('website') as HTMLInputElement).value,
        source: 'contact_page',
      };
      
      const data = await fx('api-contact-submit', 'POST', payload);
      
      if (!data?.ok) {
        toast.error('Failed to send message');
        setBusy(false);
        return;
      }
      
      // Track successful contact form submission
      const { trackEvent } = await import('@/lib/trackEvent');
      trackEvent('contact_form_submitted', {
        topic: payload.topic,
        channel_pref: payload.channel_pref,
        lang_pref: payload.lang_pref
      });
      
      setBusy(false);
      setSent('ok');
      toast.success('Message sent successfully!');
    } catch (err) {
      console.error('Contact submit error:', err);
      setBusy(false);
      setSent('err');
      toast.error('Failed to send message');
    }
  }

  async function handleExpress(){
    setExpressBusy(true);
    const name = (document.getElementById('name') as HTMLInputElement).value || 'Priority Client';
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const notes = (document.getElementById('message') as HTMLTextAreaElement).value;
    const langPref = (document.getElementById('langpref') as HTMLSelectElement)?.value || 'en';
    
    if (!email) { 
      alert('Please enter your email above first.'); 
      setExpressBusy(false); 
      return; 
    }
    
    const res = await invokeApi('/api/express/create', {
      method: 'POST',
      body: { name, email, language: langPref, notes, currency: cur, offer_slug:'priority-30' }
    });
    
    if (res.ok && res.url) {
      window.location.href = res.url;
    } else {
      toast.error(res.error || 'Unable to start payment.');
    }
    setExpressBusy(false);
  }

  return (
    <>
    <main className="container mx-auto px-4 py-12 space-y-8 max-w-6xl">
        {/* Lang switcher */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <select className="select" value={lang} onChange={e=>setLang(e.target.value as Lang)}>
            <option value="en">EN</option>
            <option value="zh-CN">简体</option>
            <option value="zh-TW">繁体</option>
          </select>
        </motion.div>

        {/* Hero */}
        <ScrollReveal>
          <section className="rounded-2xl bg-gradient-to-br from-primary to-primary-variant p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">{t.title}</h1>
            <p className="text-lg opacity-90 mb-6">{t.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <SmartLink to={ROUTES.coaching} className="btn bg-white text-primary hover:bg-white/90 transition-smooth">{t.bookBtn}</SmartLink>
              <a className="btn bg-white/10 text-white hover:bg-white/20 border-white/20 transition-smooth" href="mailto:hello@zhengrowth.com">hello@zhengrowth.com</a>
            </div>
          </section>
        </ScrollReveal>

        {/* Priority Lane Card */}
        <ScrollReveal delay={0.1}>
          <section className="card border-2 border-accent space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-xl font-semibold mb-1">{t.priority}</div>
              <p className="text-sm text-muted">{t.priorityDesc}</p>
            </div>
            <CurrencySelect value={cur} onChange={async (v)=>{
              setCur(v);
              await loadExpressPrice(v);
            }} />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-3xl font-bold">
              {expressPrice ? `${expressPrice.currency} ${(expressPrice.amount_cents/100).toFixed(2)}` : '—'}
            </div>
            {isMobile ? (
              <button 
                className="btn bg-accent text-accent-foreground hover:bg-accent/90" 
                onClick={() => setShowExpressSheet(true)}
              >
                {t.priorityBtn}
              </button>
            ) : (
              <button 
                className="btn bg-accent text-accent-foreground hover:bg-accent/90" 
                disabled={expressBusy} 
                onClick={handleExpress}
              >
                {expressBusy ? 'Processing...' : t.priorityBtn}
              </button>
            )}
          </div>

          <ul className="text-xs text-muted list-disc pl-5 space-y-1">
            <li>After payment, you will be redirected to book your slot immediately.</li>
            <li>Refunds: 100% if canceled 24h+ before your slot.</li>
          </ul>
          </section>
        </ScrollReveal>

        {/* Two-column: info + form */}
        <section className="grid md:grid-cols-5 gap-6">
          <ScrollReveal delay={0.2} className="md:col-span-2 space-y-4">
            <div className="card">
              <div className="font-semibold text-lg mb-3">{t.contact}</div>
              <p className="text-sm mb-2">{t.contactInfo}</p>
              <p className="text-sm font-medium mt-4 mb-1">{t.hours}:</p>
              <p className="text-sm text-muted">{t.hoursTxt}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} className="md:col-span-3">
            <div className="card space-y-4">
              <div className="font-semibold text-lg">{t.form}</div>

              {/* Honeypot */}
              <input id="website" type="text" className="hidden" autoComplete="off" tabIndex={-1} aria-hidden="true"/>

              <div className="grid md:grid-cols-2 gap-4">
                <input id="name" className="input" placeholder={t.name} />
                <input id="email" type="email" className="input" placeholder={t.email} />
                <input id="phone" className="input" placeholder={t.phone} />
                <input id="wechat" className="input" placeholder={t.wechat} />
                <input id="whatsapp" className="input" placeholder={t.whatsapp} />
                <select id="topic" className="select">
                  {topics.map(o=> <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
                <select id="budget" className="select">
                  {budgets.map(o=> <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
                <select id="langpref" className="select">
                  {langs.map(o=> <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
                <select id="channel" className="select">
                  {channels.map(o=> <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>

              <textarea id="message" className="textarea" rows={6} placeholder={t.message} />

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input id="consent" type="checkbox" className="checkbox mt-1" />
                <span>{t.consent}</span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button className="btn btn-cta" onClick={submit} disabled={busy}>
                  {busy?'...':t.submit}
                </button>
                <SmartLink to={ROUTES.coaching} className="btn btn-ghost">{t.bookBtn}</SmartLink>
              </div>

              {sent==='ok' && <p className="text-emerald-600 text-sm font-medium">{t.success}</p>}
              {sent==='err' && <p className="text-red-600 text-sm font-medium">{t.fail}</p>}
            </div>
          </ScrollReveal>
        </section>

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context":"https://schema.org",
          "@type":"ContactPage",
          "name":"ZhenGrowth Contact",
          "url":"https://zhengrowth.com/contact",
          "contactPoint":{
            "@type":"ContactPoint",
            "email":"hello@zhengrowth.com",
            "contactType":"customer support",
            "areaServed":["CA","US","CN","HK","TW","SG","MY"],
            "availableLanguage":["English","Chinese"]
          }
        })}}/>
      </main>

      {/* Mobile Express Pay Sheet */}
      {isMobile && (
        <ExpressPaySheet
          open={showExpressSheet}
          onClose={() => setShowExpressSheet(false)}
          defaultName={(document.getElementById('name') as HTMLInputElement)?.value || ''}
          defaultEmail={(document.getElementById('email') as HTMLInputElement)?.value || ''}
        />
      )}
    </>
  );
}
