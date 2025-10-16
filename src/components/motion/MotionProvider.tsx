import { AnimatePresence, MotionConfig } from "framer-motion";
import React from "react";

/** Global animation config with reduced-motion respect */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduce =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  return (
    <MotionConfig
      reducedMotion={reduce ? "always" : "never"}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </MotionConfig>
  );
}
