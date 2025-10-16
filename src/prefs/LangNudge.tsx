import { useEffect, useState } from 'react';
import { usePrefs } from './PrefsProvider';
import { inferRegionHint } from './region';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function LangNudge() {
  const { lang, setLang } = usePrefs();
  const [suggest, setSuggest] = useState<'zh-CN' | 'zh-TW' | null>(null);

  useEffect(() => {
    // Only show once per device, and not if already using Chinese
    if (localStorage.getItem('zg.lang.nudge') === 'done') return;
    if (lang === 'zh-CN' || lang === 'zh-TW') return;

    const hint = inferRegionHint();
    if (hint === 'zh-CN' || hint === 'zh-TW') {
      // Small delay to avoid flash on page load
      setTimeout(() => setSuggest(hint), 1000);
    }
  }, [lang]);

  if (!suggest) return null;

  function accept() {
    setLang(suggest!);
    localStorage.setItem('zg.lang.nudge', 'done');
    setSuggest(null);
  }

  function dismiss() {
    localStorage.setItem('zg.lang.nudge', 'done');
    setSuggest(null);
  }

  const messages = {
    'zh-CN': {
      prompt: '我们检测到您可能偏好简体中文。切换语言？',
      accept: '切换到简体',
      dismiss: '不用了'
    },
    'zh-TW': {
      prompt: '我們偵測到您可能偏好繁體中文。要切換語言嗎？',
      accept: '切換到繁體',
      dismiss: '不用'
    }
  };

  const msg = messages[suggest];

  return (
    <div className="fixed left-4 right-4 bottom-4 z-50 sm:left-auto sm:right-4 sm:max-w-md">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-card-foreground font-medium mb-3">
              {msg.prompt}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={accept}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {msg.accept}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={dismiss}
              >
                {msg.dismiss}
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
