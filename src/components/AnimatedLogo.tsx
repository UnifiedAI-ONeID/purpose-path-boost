import { motion } from 'framer-motion';
import logoImage from '@/assets/images/logo.png';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function AnimatedLogo({ size = 'lg', showText = false, className = '' }: AnimatedLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        className={`relative ${sizeClasses[size]}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Inner pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.2, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />
        
        {/* Logo with breathing animation */}
        <motion.img
          src={logoImage}
          alt="ZhenGrowth Logo"
          className={`${sizeClasses[size]} relative z-10 object-contain drop-shadow-lg`}
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      
      {showText && (
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.span
            className="text-sm font-medium text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading
          </motion.span>
          <motion.span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

// Full-screen loading overlay with animated logo
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-4">
        <AnimatedLogo size="xl" />
        {message && (
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// Simple inline loading spinner with logo
export function LogoSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <motion.img
      src={logoImage}
      alt="Loading"
      className={`${sizeClasses[size]} object-contain`}
      animate={{
        rotate: 360,
        scale: [1, 1.1, 1],
      }}
      transition={{
        rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
        scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
}

export default AnimatedLogo;
