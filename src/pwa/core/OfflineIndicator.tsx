import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from './PWAProvider';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Show "back online" briefly then hide
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-colors ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-orange-500 text-white'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="inline h-4 w-4 mr-2" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="inline h-4 w-4 mr-2" />
          You're offline - some features limited
        </>
      )}
    </div>
  );
}
