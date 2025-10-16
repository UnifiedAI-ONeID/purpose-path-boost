import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function SmartCTA({
  children,
  className = '',
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & any) {
  const [ping, setPing] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setPing(true), 3000); // nudge after 3s
    const v = setTimeout(() => setPing(false), 5200);
    return () => {
      clearTimeout(t);
      clearTimeout(v);
    };
  }, []);

  return (
    <motion.button
      whileHover={{ y: -1, boxShadow: "0 8px 24px hsl(var(--primary) / 0.22)" }}
      whileTap={{ scale: 0.98 }}
      className={`btn btn-cta ${className}`}
      {...rest}
    >
      {children}
      <AnimatePresence>
        {ping && (
          <motion.span
            key="ring"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="ml-2 inline-block w-2 h-2 rounded-full bg-white/80 shadow"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
