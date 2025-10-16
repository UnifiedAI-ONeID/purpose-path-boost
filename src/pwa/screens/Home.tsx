import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import SmartLink from '@/components/SmartLink';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    fetch(`/api/pwa/boot?device=${device}`, {
      headers: { 'Accept-Language': lang }
    })
      .then(r => r.json())
      .then(setBoot);

    // Track page view
    fetch('/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: device,
        event: 'view_home',
        payload: { source: 'pwa' }
      })
    });
  }, [lang]);

  const heroTitle = boot?.hero
    ? boot.hero[`title_${langMap(lang)}`] || 'Grow with Clarity'
    : 'Grow with Clarity';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Card className="rounded-2xl p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <h1 className="text-3xl font-bold mb-2">{heroTitle}</h1>
        <p className="opacity-90 mb-4">Start with a 60-second self-assessment.</p>
        <SmartLink href="/pwa/quiz">
          <Button size="lg" variant="secondary">Begin Assessment</Button>
        </SmartLink>
      </Card>

      <div className="mt-6 space-y-3">
        <SmartLink href="/coaching">
          <Button variant="outline" className="w-full">Explore Coaching Programs</Button>
        </SmartLink>
        <SmartLink href="/pwa/dashboard">
          <Button variant="outline" className="w-full">My Dashboard</Button>
        </SmartLink>
      </div>
    </div>
  );
}
