import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOHelmet } from '@/components/SEOHelmet';

function getOrSetDevice() {
  let id = localStorage.getItem('zg.device');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('zg.device', id);
  }
  return id;
}

function langMap(l: string) {
  return l === 'zh-CN' ? 'zh_cn' : l === 'zh-TW' ? 'zh_tw' : 'en';
}

export default function Home() {
  const { lang } = usePrefs();
  const [boot, setBoot] = useState<any>(null);

  useEffect(() => {
    const device = getOrSetDevice();
    
    // Call Cloud Run API
    // In dev, this might need to point to localhost:8080 if proxied, or full URL
    // Assuming /api proxy is set up in vite.config and firebase.json
    fetch('/api/pwa-boot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': lang,
        'x-zg-device': device
      },
      body: JSON.stringify({ device, lang })
    })
    .then(res => res.json())
    .then(data => {
      if (data?.ok) setBoot(data);
    })
    .catch(err => console.error('Boot error:', err));

    // Track page view
    fetch('/api/pwa-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: device,
        event: 'view_home',
        payload: { source: 'pwa' }
      })
    }).catch(() => {}); // Silent fail

  }, [lang]);

  const heroTitle = boot?.hero
    ? boot.hero[`title_${langMap(lang)}`] || 'Grow with Clarity'
    : 'Grow with Clarity';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <SEOHelmet
        title="ZhenGrowth - Grow with Clarity"
        description="Life & career coaching for Chinese-speaking professionals worldwide. Start with a 60-second self-assessment to discover your path to clarity and growth."
        path="/pwa/home"
        lang={lang as 'en'|'zh-CN'|'zh-TW'}
        image="https://zhengrowth.com/app-icon-512.png"
      />
      <Card className="rounded-2xl p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <h1 className="text-3xl font-bold mb-2">{heroTitle}</h1>
        <p className="opacity-90 mb-4">Start with a 60-second self-assessment.</p>
        <Button size="lg" variant="secondary" asChild>
          <SmartLink to={ROUTES.quiz}>Begin Assessment</SmartLink>
        </Button>
      </Card>
    </div>
  );
}
