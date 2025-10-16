import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

function langKey(l: string) {
  return l === 'zh-CN' ? 'zh_cn' : l === 'zh-TW' ? 'zh_tw' : 'en';
}

export default function Quiz() {
  const { lang } = usePrefs();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.functions
        .invoke('pwa-boot', {
          body: { lang },
          headers: { 'Accept-Language': lang }
        })
        .then(({ data }) => {
          if (data?.ok) setCfg(data.quiz || []);
        });
    });
  }, [lang]);

  async function choose(choice: any) {
    const device_id = localStorage.getItem('zg.device')!;
    
    const { supabase } = await import('@/integrations/supabase/client');
    supabase.functions.invoke('pwa-quiz-answer', {
      body: {
        device_id,
        question_key: cfg[idx].key,
        choice_value: choice.value
      }
    });

    const newTags = Array.from(new Set([...tags, choice.tag].filter(Boolean)));
    setTags(newTags);

    if (idx < cfg.length - 1) {
      setIdx(idx + 1);
    } else {
      // Navigate to recommended coaching
      const params = new URLSearchParams({ tags: newTags.join(','), lang });
      navigate(`/coaching?${params}`);
    }
  }

  if (!cfg.length) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center">Loading quiz...</div>
      </main>
    );
  }

  const q = cfg[idx];
  const progress = ((idx + 1) / cfg.length) * 100;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          Question {idx + 1} of {cfg.length}
        </p>
      </div>

      <Card className="p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">
          {q[`title_${langKey(lang)}`] || q.title_en}
        </h2>
      </Card>

      <div className="grid gap-3">
        {q.choices.map((c: any) => (
          <Button
            key={c.value}
            variant="outline"
            className="h-auto py-4 px-6 text-left justify-start hover:bg-accent"
            onClick={() => choose(c)}
          >
            {c[`label_${langKey(lang)}`] || c.label_en}
          </Button>
        ))}
      </div>
    </main>
  );
}
