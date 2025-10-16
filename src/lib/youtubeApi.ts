let apiPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise;
  
  apiPromise = new Promise((resolve) => {
    // Check if already loaded
    if ((window as any).YT?.Player) {
      return resolve();
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);

    // YouTube calls this when ready
    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('[YouTube API] Loaded and ready');
      resolve();
    };
  });

  return apiPromise;
}

// Type definitions for YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
