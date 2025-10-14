import { useState, useEffect, useRef } from 'react';

interface LiteVideoProps {
  src?: string;
  poster: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  className?: string;
}

export const LiteVideo = ({
  src,
  poster,
  autoplay = false,
  muted = true,
  loop = true,
  playsInline = true,
  className = '',
}: LiteVideoProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsLoaded(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [isLoaded]);

  // If no video source provided, just show the poster
  if (!src) {
    return (
      <img
        src={poster}
        alt="Hero visual"
        className={className}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay={autoplay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      className={className}
      preload="metadata"
    >
      {isLoaded && (
        <>
          <source src={src} type="video/webm" />
          <source src={src.replace('.webm', '.mp4')} type="video/mp4" />
        </>
      )}
      {/* Fallback for browsers that don't support video */}
      <img src={poster} alt="Video fallback" />
    </video>
  );
};
