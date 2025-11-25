
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface PWAContextType {
  user: User | null;
  isGuest: boolean;
  deviceId: string;
  profileId: string | null;
  bootData: any;
  isOnline: boolean;
  isInstalled: boolean;
  loading: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) throw new Error('usePWA must be used within PWAProvider');
  return context;
}

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('zg.device');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('zg.device', id);
  }
  return id;
}

function isPWAInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    localStorage.getItem('zg.pwa.installed') === '1'
  );
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [bootData, setBootData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const deviceId = getOrCreateDeviceId();
  const isInstalled = isPWAInstalled();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchProfile(firebaseUser.uid);
      } else {
        setProfileId(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Assuming profile doc ID matches auth UID
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        setProfileId(snap.id);
      } else {
        setProfileId(null);
      }
    } catch (err) {
      console.error('[PWA] Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootPWA = async () => {
      try {
        const res = await fetch('/api/pwa-boot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            device: deviceId,
            lang: localStorage.getItem('zg.lang') || 'en'
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setBootData(data);
          }
        }
      } catch (err) {
        console.error('[PWA] Boot failed:', err);
      }
    };

    bootPWA();
  }, [deviceId]);

  const value: PWAContextType = {
    user,
    isGuest: !user,
    deviceId,
    profileId,
    bootData,
    isOnline,
    isInstalled,
    loading
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}
