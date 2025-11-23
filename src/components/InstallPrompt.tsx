import React, { useEffect, useState } from 'react';
import { usePWAPrompt } from '@/hooks/usePWAPrompt';
import { usePrefs } from '@/prefs/PrefsProvider';
import { Button } from './ui/button';
import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/images/logo.png';

// Import the type for the BeforeInstallPromptEvent
import { BeforeInstallPromptEvent } from './A2HSPrompt';

type Props = { delayMs?: number; minVisits?: number };

function enoughTimeSinceDismiss(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const last = Number(localStorage.getItem('zg.pwa.dismiss_at') || 0);
    return Date.now() - last > 7 * 24 * 60 * 60 * 1000; // 7 days
  } catch {
    return true;
  }
}

function incVisits(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const k = 'zg.pwa.visits';
    const v = Number(localStorage.getItem(k) || 0) + 1;
    localStorage.setItem(k, String(v));
    return v;
  } catch {
    return 1;
  }
}

export default function InstallPrompt({ delayMs = 8000, minVisits = 2 }: Props) {
  const { deferred, installed, eligible, isiOS } = usePWAPrompt();
  const { lang } = usePrefs();
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    // SSR guard - only run in browser
    if (typeof window === 'undefined') return;
    if (!eligible || installed) return;
    
    const visits = incVisits();
    if (!enoughTimeSinceDismiss() || visits < minVisits) return;

    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [eligible, installed, delayMs, minVisits]);

  if (!show || installed || !eligible) return null;

  const title =
    lang === 'zh-CN'
      ? '安装 ZhenGrowth 应用'
      : lang === 'zh-TW'
      ? '安裝 ZhenGrowth 應用'
      : 'Install ZhenGrowth App';
  
  const subtitle =
    lang === 'zh-CN'
      ? '像商店下载的 App 一样使用，启动更快、体验更好。'
      : lang === 'zh-TW'
      ? '像商店下載的 App 一樣使用，啟動更快、體驗更好。'
      : 'Use it like a store app — faster starts, better experience.';
  
  const btnInstall = lang === 'zh-CN' ? '立即安装' : lang === 'zh-TW' ? '立即安裝' : 'Install';
  const btnHow = lang === 'zh-CN' ? '如何安装' : lang === 'zh-TW' ? '如何安裝' : 'How to install';
  const btnLater = lang === 'zh-CN' ? '稍后' : lang === 'zh-TW' ? '稍後' : 'Later';

  async function onInstallClick() {
    if (deferred && !isiOS) {
      // Android/Chrome: show native prompt
      await (deferred as BeforeInstallPromptEvent).prompt();
      const choice = await (deferred as BeforeInstallPromptEvent).userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem('zg.pwa.installed', '1');
      } else {
        localStorage.setItem('zg.pwa.dismiss_at', String(Date.now()));
      }
      setShow(false);
    } else {
      // iOS: show steps overlay
      setIosHelp(true);
    }
  }

  function onLater() {
    localStorage.setItem('zg.pwa.dismiss_at', String(Date.now()));
    setShow(false);
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-8 md:max-w-md"
          >
            <div className="relative rounded-2xl border bg-card shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              
              <div className="relative p-4">
                <button
                  onClick={onLater}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <img src={logo} alt="ZhenGrowth" className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground mb-1">{title}</div>
                    <div className="text-sm text-muted-foreground mb-3">{subtitle}</div>
                    
                    <div className="flex gap-2">
                      <Button onClick={onInstallClick} size="sm" className="flex-1">
                        {deferred && !isiOS ? (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            {btnInstall}
                          </>
                        ) : (
                          <>
                            <Share className="mr-2 h-4 w-4" />
                            {btnHow}
                          </>
                        )}
                      </Button>
                      <Button onClick={onLater} variant="ghost" size="sm">
                        {btnLater}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS instruction sheet */}
      <AnimatePresence>
        {iosHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] bg-black/60 backdrop-blur-sm grid place-items-end"
            onClick={() => setIosHelp(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-lg bg-card rounded-t-3xl p-6 border-t shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="ZhenGrowth" className="w-10 h-10 rounded-xl" />
                <div className="font-semibold text-lg">{title}</div>
              </div>

              <ol className="text-sm space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <span className="text-muted-foreground pt-0.5">
                    {lang === 'zh-CN'
                      ? '点击 Safari 的"分享"按钮'
                      : lang === 'zh-TW'
                      ? '點擊 Safari 的「分享」按鈕'
                      : 'Tap the Share button in Safari'}
                    <Share className="inline-block ml-1 h-4 w-4" />
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <span className="text-muted-foreground pt-0.5">
                    {lang === 'zh-CN'
                      ? '选择"添加到主屏幕"'
                      : lang === 'zh-TW'
                      ? '選擇「加入主畫面」'
                      : 'Select "Add to Home Screen"'}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <span className="text-muted-foreground pt-0.5">
                    {lang === 'zh-CN'
                      ? '确认名称后点"添加"'
                      : lang === 'zh-TW'
                      ? '確認名稱後點「加入」'
                      : 'Confirm the name and tap "Add"'}
                  </span>
                </li>
              </ol>

              <Button onClick={() => setIosHelp(false)} className="w-full">
                {lang === 'zh-CN' ? '知道了' : lang === 'zh-TW' ? '知道了' : 'Got it'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
