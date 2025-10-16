import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

let activePlayPromise: Promise<void> | null = null;

/**
 * Standalone HomeClick animation component
 * Renders into #zg-homeclick-layer portal if available
 */
export function play(): Promise<void> {
  if (activePlayPromise) return activePlayPromise;

  activePlayPromise = new Promise((resolve) => {
    const container = document.getElementById('zg-homeclick-layer');
    if (!container) {
      resolve();
      activePlayPromise = null;
      return;
    }

    // Create temporary react root for animation
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(container);
      
      function AnimationPlayer() {
        const [show, setShow] = useState(true);

        return (
          <AnimatePresence
            onExitComplete={() => {
              setTimeout(() => {
                root.unmount();
                resolve();
                activePlayPromise = null;
              }, 100);
            }}
          >
            {show && (
              <motion.div
                aria-hidden="true"
                className="fixed inset-0 z-[9999] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
                onAnimationComplete={() => {
                  setTimeout(() => setShow(false), 200);
                }}
              >
                {/* Jade background gradient */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(1200px 700px at 50% 110%, hsl(var(--jade-700)), transparent 60%),
                                 linear-gradient(180deg, hsl(var(--jade-800)), hsl(var(--jade-900)))`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.2 }}
                  transition={{ duration: 0.3 }}
                />

                {/* SVG plant + wordmark */}
                <motion.div
                  className="absolute inset-0 grid place-items-center"
                  initial={{ scale: 0.98, filter: 'blur(6px)', opacity: 0 }}
                  animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                  exit={{ scale: 1.03, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <GoldPlant />
                    <div className="px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20 bg-white/10 text-center">
                      <div
                        className="text-[26px] sm:text-[34px] font-semibold tracking-tight"
                        style={{
                          background: 'linear-gradient(90deg, hsl(var(--gold-600)), hsl(var(--gold-400)))',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent'
                        }}
                      >
                        Grow with Clarity
                      </div>
                      <div className="text-xs sm:text-sm text-white/80 mt-1">ZhenGrowth</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      }

      root.render(<AnimationPlayer />);
    });
  });

  return activePlayPromise;
}

/* Gold budding plant SVG with draw + grow animations */
function GoldPlant() {
  const dur = 0.9;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      role="img"
      aria-label="Growing plant"
      style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.25))' }}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--gold-400))" />
          <stop offset="60%" stopColor="hsl(var(--gold-500))" />
          <stop offset="100%" stopColor="hsl(var(--gold-600))" />
        </linearGradient>
        <radialGradient id="budGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--gold-400))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--gold-400))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Stem */}
      <motion.path
        d="M90 150 C90 130 92 118 96 108 C100 98 103 90 103 78"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, ease }}
      />

      {/* Left leaf */}
      <motion.path
        d="M88 118 C74 112 68 100 70 92 C80 94 88 102 90 112 Z"
        fill="url(#goldGrad)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.35, ease }}
        style={{ transformOrigin: '80px 108px' }}
      />

      {/* Right leaf */}
      <motion.path
        d="M102 112 C114 106 120 94 118 86 C108 90 100 98 98 108 Z"
        fill="url(#goldGrad)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.42, duration: 0.35, ease }}
        style={{ transformOrigin: '110px 100px' }}
      />

      {/* Bud */}
      <motion.circle
        cx="103"
        cy="76"
        r="6"
        fill="url(#goldGrad)"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.35, ease }}
      />

      {/* Glow around bud */}
      <motion.circle
        cx="103"
        cy="76"
        r="16"
        fill="url(#budGlow)"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ delay: 0.65, duration: 0.4, ease }}
      />
    </svg>
  );
}

// Register with window for easy access
if (typeof window !== 'undefined') {
  window.ZGHomeClick = { play };
}
