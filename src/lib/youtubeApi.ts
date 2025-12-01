/**
 * @file This file manages the asynchronous loading of the YouTube IFrame Player API.
 * It ensures that the API is loaded only once and provides a promise-based interface
 * to signal when the API is ready for use.
 */

// --- Type Definitions for YouTube IFrame API ---

/**
 * Extends the global Window interface to include the YouTube API namespace (`YT`)
 * and the callback function that the YouTube script invokes upon loading.
 */
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YT.PlayerOptions) => YT.Player;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// --- Module-level State ---

/**
 * A promise that resolves when the YouTube IFrame API is loaded and ready.
 * This is used as a singleton to prevent the API from being loaded multiple times.
 * @type {Promise<void> | null}
 */
let apiPromise: Promise<void> | null = null;

// --- Core Function ---

/**
 * Asynchronously loads the YouTube IFrame Player API.
 *
 * This function is idempotent; it can be called multiple times, but it will only
 * execute the loading process once. It returns a promise that resolves when the
 * `onYouTubeIframeAPIReady` callback is fired by the YouTube script.
 *
 * @returns {Promise<void>} A promise that resolves when the API is ready to be used.
 */
export function loadYouTubeAPI(): Promise<void> {
  // If the promise already exists, it means the API is either loading or has loaded.
  // Return the existing promise to avoid redundant script injection.
  if (apiPromise) {
    return apiPromise;
  }

  // Create a new promise to manage the loading state.
  apiPromise = new Promise((resolve) => {
    // Check if the API was loaded by another script on the page.
    if (window.YT?.Player) {
      console.log('[YouTube API] API already available.');
      return resolve();
    }

    // Define the global callback function that the YouTube script will call.
    window.onYouTubeIframeAPIReady = () => {
      console.log('[YouTube API] Loaded and ready via onYouTubeIframeAPIReady.');
      resolve();
    };

    // Create and inject the <script> tag to load the API.
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
    
    console.log('[YouTube API] Injected API script tag.');
  });

  return apiPromise;
}
