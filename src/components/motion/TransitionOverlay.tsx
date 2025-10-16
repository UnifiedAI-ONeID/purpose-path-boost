import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefs } from '@/prefs/PrefsProvider';

type Props = {
  show: boolean;
  onDone?: () => void;
  phrase?: string;
  minDurationMs?: number;
};

const phrases = {
  'en': 'Grow with Clarity',
  'zh-CN': '清晰成长',
  'zh-TW': '清晰成長'
};

export default function TransitionOverlay({
  show,
  onDone,
  phrase,
  minDurationMs = 550
}: Props) {
  const { lang } = usePrefs();
  const [visible, setVisible] = useState(show);
  const [mountedAt, setMountedAt] = useState(0);

  const displayPhrase = phrase || phrases[lang];

  useEffect(() => {
    if (show) {
      setVisible(true);
      setMountedAt(performance.now());
    } else if (visible) {
      const elapsed = performance.now() - mountedAt;
      const wait = Math.max(0, minDurationMs - elapsed);
      const t = setTimeout(() => setVisible(false), wait);
      return () => clearTimeout(t);
    }
  }, [show, visible, minDurationMs, mountedAt]);

  useEffect(() => {
    if (!visible && onDone) onDone();
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
        >
          {/* Backdrop with gradient */}
          <motion.div
            className="absolute inset-0 bg-transition-overlay"
            style={{
              background: 'radial-gradient(1200px 600px at 50% 110%, hsl(var(--primary) / 0.2), transparent 60%), var(--overlay-bg)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.2 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Branded wordmark */}
          <motion.div
            className="absolute inset-0 grid place-items-center"
            initial={{ scale: 0.98, filter: 'blur(6px)', opacity: 0 }}
            animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
            exit={{ scale: 1.03, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 py-4 rounded-2xl backdrop-blur-md border border-border/70 bg-card/70 shadow-lg text-center">
              <div className="text-[28px] sm:text-[36px] font-semibold tracking-tight text-foreground">
                {displayPhrase}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                ZhenGrowth
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
