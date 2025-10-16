import { motion } from "framer-motion";

export const Shake = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={false}
    animate={{ x: [0, -6, 6, -4, 4, 0] }}
    transition={{ duration: 0.35 }}
  >
    {children}
  </motion.div>
);

export const Toast = ({ ok, text }: { ok: boolean; text: string }) => (
  <motion.div
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: -10, opacity: 0 }}
    transition={{ duration: 0.25 }}
    className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl text-sm ${
      ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}
  >
    {text}
  </motion.div>
);
