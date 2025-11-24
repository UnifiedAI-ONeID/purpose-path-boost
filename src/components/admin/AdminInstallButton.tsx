import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function AdminInstallButton() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !location.pathname.startsWith("/admin")) return;

    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      ('standalone' in window.navigator && (window.navigator as NavigatorWithStandalone).standalone === true);
    if (isStandalone) setInstalled(true);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (typeof window === 'undefined' || !location.pathname.startsWith("/admin") || installed) return null;

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent);
  }

  async function install() {
    if (bip) {
      await bip.prompt();
      try {
        const choice = await bip.userChoice;
        console.log('[Admin PWA] Install choice:', choice?.outcome);
      } finally {
        setBip(null);
      }
    } else if (isIOS()) {
      setShowIOSHelp(true);
    } else {
      alert("Install this Admin app from your browser menu: Add to Home screen.");
    }
  }

  return (
    <>
      <button
        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
        onClick={install}
        title="Install ZG Admin on your device"
      >
        Install Admin App
      </button>

      {showIOSHelp && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowIOSHelp(false)}
          />
          <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-card border-t border-border p-6 animate-in slide-in-from-bottom">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3">Install on iPhone/iPad</h3>
            <ol className="text-sm space-y-2 list-decimal pl-5">
              <li>
                Tap the <span className="font-medium text-primary">Share</span> icon in Safari
                (square with arrow pointing up).
              </li>
              <li>
                Scroll down and choose{" "}
                <span className="font-medium text-primary">Add to Home Screen</span>.
              </li>
              <li>
                Confirm "ZG Admin" and tap <span className="font-medium text-primary">Add</span>.
              </li>
            </ol>
            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setShowIOSHelp(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
