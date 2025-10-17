import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type BIEvent = BeforeInstallPromptEvent;

function isiOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  // SSR guard
  if (typeof window === 'undefined') return false;
  // iOS + Android PWA check
  // @ts-ignore
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone === true;
}

export function usePWAPrompt() {
  const [deferred, setDeferred] = useState<BIEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [eligible, setEligible] = useState<boolean>(false);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;
    
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BIEvent);
      setEligible(true);
    }
    
    function onAppInstalled() {
      setInstalled(true);
      setDeferred(null);
      try {
        localStorage.setItem('zg.pwa.installed', '1');
      } catch (e) {
        console.warn('localStorage not available:', e);
      }
    }
    
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', onAppInstalled);
    
    // Initial eligibility (iOS never fires beforeinstallprompt)
    setEligible(!isStandalone());
    
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  return {
    deferred,          // null on iOS
    installed: installed || isStandalone() || localStorage.getItem('zg.pwa.installed') === '1',
    eligible: eligible && !isStandalone(),
    isiOS: isiOS(),
  };
}
