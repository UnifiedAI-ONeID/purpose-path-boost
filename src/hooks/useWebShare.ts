import { useState } from 'react';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface UseWebShareReturn {
  share: (data: ShareData) => Promise<boolean>;
  canShare: boolean;
  isSharing: boolean;
  error: Error | null;
}

export function useWebShare(): UseWebShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const share = async (data: ShareData): Promise<boolean> => {
    if (!canShare) {
      setError(new Error('Web Share API not supported'));
      return false;
    }

    setIsSharing(true);
    setError(null);

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || window.location.href,
        files: data.files
      });
      setIsSharing(false);
      return true;
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
      setIsSharing(false);
      return false;
    }
  };

  return { share, canShare, isSharing, error };
}
