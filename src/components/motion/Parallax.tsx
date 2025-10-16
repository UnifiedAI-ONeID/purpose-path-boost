import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";

export default function ParallaxHero({
  children,
  height = 360
}: {
  children: React.ReactNode;
  height?: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const yImg = useTransform(scrollYProgress, [0, 1], [0, -80]); // background drift
  const yTxt = useTransform(scrollYProgress, [0, 1], [0, -20]); // text subtle

  return (
    <section
      ref={ref}
      style={{ height }}
      className="relative rounded-2xl overflow-hidden"
    >
      <motion.div style={{ y: yImg }} className="absolute inset-0 -z-10">
        <div
          className="w-full h-full"
          style={{
            background:
              'radial-gradient(1200px 500px at 30% -10%, hsl(var(--primary) / 0.15), transparent)'
          }}
        />
      </motion.div>
      <motion.div style={{ y: yTxt }} className="p-4 h-full flex items-end">
        {children}
      </motion.div>
    </section>
  );
}
