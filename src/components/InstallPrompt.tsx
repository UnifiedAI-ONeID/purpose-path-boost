import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed or already installed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const installed = localStorage.getItem('pwa-installed');
      
      if (!dismissed && !installed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">Install ZhenGrowth</div>
              <div className="text-sm text-muted-foreground">Quick access & offline support</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition"
              onClick={handleDismiss}
            >
              Later
            </button>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition"
              onClick={handleInstall}
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
