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
    
    // Use Supabase function
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.functions
        .invoke('pwa-boot', {
          body: { device, lang },
          headers: { 'Accept-Language': lang, 'x-zg-device': device }
        })
        .then(({ data }) => {
          if (data?.ok) setBoot(data);
        });

      // Track page view
      supabase.functions.invoke('pwa-telemetry', {
        body: {
          device_id: device,
          event: 'view_home',
          payload: { source: 'pwa' }
        }
      });
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
    </div>
  );
}
