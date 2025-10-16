import { motion } from "framer-motion";

export function StaggerList({ children }: { children: React.ReactNode }) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45 } }
      }}
    >
      {children}
    </motion.li>
  );
}
