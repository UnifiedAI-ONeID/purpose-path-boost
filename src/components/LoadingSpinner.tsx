import { AnimatedLogo } from './AnimatedLogo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ size = 'lg', fullScreen = true, message }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AnimatedLogo size={size} showText={!!message} />
        {message && (
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <AnimatedLogo size={size} showText={false} />
    </div>
  );
}

export default LoadingSpinner;
