/**
 * @file This file implements a "version guard" system to ensure that users are always
 * running the latest version of the web application. It monitors a version number
 * in Firestore and, upon detecting an update, clears all local caches and forces
 * a page reload.
 */

import { db } from '@/firebase/config';
import { doc, onSnapshot, getDoc, DocumentData } from 'firebase/firestore';
import { logger } from './log';

// --- Constants ---

const LS_VERSION_KEY = 'zg.content.version';
const FIRESTORE_CONFIG_PATH = 'config/system';

// Prefixes for identifying cache and localStorage keys that should be cleared.
const CACHE_PREFIXES_TO_PURGE = ['api-swr-', 'zg-img-', 'workbox-precache', 'workbox-runtime'];
const LS_PREFIXES_TO_PURGE = ['cache:', 'zg.pwa.', 'zg.i18n.', 'zg.offer.'];
const IDB_NAMES_TO_PURGE = ['workbox-expiration', 'keyval-store', 'zg-idb'];

// --- State ---

let isInitialized = false;

// --- Core Logic ---

/**
 * Handles the logic of comparing the remote version with the local version and
 * triggering a refresh if necessary.
 *
 * @param {number} remoteVersion - The version number fetched from the remote source.
 */
async function handleVersionUpdate(remoteVersion: number): Promise<void> {
  if (isNaN(remoteVersion)) {
    logger.warn('[VersionGuard] Invalid remote version received.');
    return;
  }

  const localVersion = Number(localStorage.getItem(LS_VERSION_KEY) || '0');
  logger.info(`[VersionGuard] Version check: Local=${localVersion}, Remote=${remoteVersion}`);

  if (localVersion === 0) {
    // This is the first run; just store the current version.
    localStorage.setItem(LS_VERSION_KEY, String(remoteVersion));
    return;
  }

  if (remoteVersion > localVersion) {
    logger.warn(`[VersionGuard] New version detected (v${remoteVersion}). Purging caches and reloading.`);
    
    // Update local version immediately to prevent reload loops.
    localStorage.setItem(LS_VERSION_KEY, String(remoteVersion));
    
    await purgeAllCaches();
    
    // A short delay can help ensure all cleanup tasks complete.
    setTimeout(() => window.location.reload(), 500);
  }
}

/**
 * Fetches the current application version from Firestore.
 * @returns {Promise<number>} The version number, or 0 if it cannot be fetched.
 */
async function fetchRemoteVersion(): Promise<number> {
  try {
    const docRef = doc(db, FIRESTORE_CONFIG_PATH);
    const snap = await getDoc(docRef);
    return Number(snap.data()?.version || 0);
  } catch (error) {
    logger.error('[VersionGuard] Failed to fetch remote version.', { error });
    return 0; // Return 0 to prevent accidental purges on network errors.
  }
}

/**
 * Wipes all known client-side storage to ensure a clean slate for the new version.
 */
async function purgeAllCaches(): Promise<void> {
  logger.info('[VersionGuard] Starting cache purge...');
  
  const purgePromises: Promise<any>[] = [];

  // 1. Service Worker Cache (via message)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage('PURGE_CACHES');
    logger.debug('[VersionGuard] Sent PURGE_CACHES message to service worker.');
  }

  // 2. CacheStorage API
  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (CACHE_PREFIXES_TO_PURGE.some(prefix => name.startsWith(prefix))) {
        purgePromises.push(caches.delete(name).then(() => logger.debug(`Deleted cache: ${name}`)));
      }
    }
  } catch (error) {
    logger.error('[VersionGuard] Failed to purge CacheStorage.', { error });
  }

  // 3. LocalStorage
  try {
    for (const key in localStorage) {
      if (LS_PREFIXES_TO_PURGE.some(prefix => key.startsWith(prefix))) {
        purgePromises.push(Promise.resolve().then(() => {
          localStorage.removeItem(key);
          logger.debug(`Removed localStorage key: ${key}`);
        }));
      }
    }
  } catch (error) {
    logger.error('[VersionGuard] Failed to purge LocalStorage.', { error });
  }

  // 4. IndexedDB
  try {
    for (const dbName of IDB_NAMES_TO_PURGE) {
      purgePromises.push(new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => { logger.debug(`Deleted IndexedDB: ${dbName}`); resolve(); };
        request.onerror = () => reject(request.error);
      }));
    }
  } catch (error) {
    logger.error('[VersionGuard] Failed to purge IndexedDB.', { error });
  }

  await Promise.all(purgePromises);
  logger.info('[VersionGuard] Cache purge completed.');
}

// --- Initialization ---

/**
 * Initializes the version guard system. It sets up a real-time listener on Firestore
 * to detect version changes and performs an initial check.
 */
export function bootVersionGuard(): void {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }
  isInitialized = true;

  try {
    const docRef = doc(db, FIRESTORE_CONFIG_PATH);
    
    // Set up a real-time listener for instant updates.
    onSnapshot(docRef, (docSnap: DocumentData) => {
      const remoteVersion = Number(docSnap.data()?.version || 0);
      if (remoteVersion > 0) {
        handleVersionUpdate(remoteVersion);
      }
    }, error => {
      logger.error('[VersionGuard] Real-time subscription failed.', { error });
    });

    // Perform an initial check on boot, in case the listener is slow to attach.
    fetchRemoteVersion().then(handleVersionUpdate);
    
    logger.info('[VersionGuard] Initialized.');

  } catch (error) {
    logger.error('[VersionGuard] Failed to initialize.', { error });
  }
}
