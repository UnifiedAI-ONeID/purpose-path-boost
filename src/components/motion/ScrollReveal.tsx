import { motion, useAnimation, Variants } from "framer-motion";
import { useEffect, useRef, ElementType } from "react";

type TDir = "up" | "down" | "left" | "right" | "none";
type Props = {
  children: React.ReactNode;
  once?: boolean;
  delay?: number;
  dir?: TDir;
  as?: ElementType;
  className?: string;
  threshold?: number;
};

const base: Variants = {
  hidden: { opacity: 0, y: 0, x: 0, scale: 0.98, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }
};

function offset(dir: TDir) {
  switch (dir) {
    case "up":
      return { y: 16 };
    case "down":
      return { y: -16 };
    case "left":
      return { x: 16 };
    case "right":
      return { x: -16 };
    default:
      return {};
  }
}

export default function ScrollReveal({
  children,
  once = true,
  delay = 0,
  dir = "up",
  as: Cmp = motion.div,
  className,
  threshold = 0.25
}: Props) {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) controls.start("show");
          else if (!once) controls.start("hidden");
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controls, once, threshold]);

  return (
    <Cmp
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { ...base.hidden, ...offset(dir) },
        show: { ...base.show, transition: { delay, duration: 0.5 } }
      }}
      className={className}
    >
      {children}
    </Cmp>
  );
}
