import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function A2HSPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if user has visited before
    const visits = parseInt(localStorage.getItem('app_visits') || '0');
    const dismissed = localStorage.getItem('a2hs_dismissed');
    const installed = localStorage.getItem('a2hs_installed');

    // Show after 2 successful visits, if not dismissed/installed
    if (visits >= 2 && !dismissed && !installed) {
      // Listen for the beforeinstallprompt event
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      // Also check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        localStorage.setItem('a2hs_installed', 'true');
      }

      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      localStorage.setItem('a2hs_installed', 'true');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('a2hs_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-slide-in-bottom">
      <div className="bg-gradient-to-br from-brand to-accent p-5 rounded-2xl shadow-2xl border border-white/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-3 mb-3">
          <Download size={24} className="text-white shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-1">Install ZhenGrowth</h3>
            <p className="text-white/90 text-sm">
              Add to your home screen for quick access and offline use
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-white text-brand hover:bg-white/90 font-medium"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
