
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient, AppUser } from '@/auth';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';

interface PWAContextType {
  user: AppUser | null;
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
  const [user, setUser] = useState<AppUser | null>(null);
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
    const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';

    if (authProvider === 'firebase') {
      const unsubscribe = authClient.onAuthStateChanged((user: AppUser | null) => {
        setUser(user);
        if (user) {
          fetchProfile(user.uid);
        } else {
          setProfileId(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      authClient.getSession().then(({ data: { session } }: any) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = authClient.onAuthStateChange((_event: any, session: any) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfileId(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';
      if (authProvider === 'supabase') {
        const { data: { session } } = await authClient.getSession();
        if (!session && user) {
          console.log('[PWA] Session expired, logging out');
          setUser(null);
          setProfileId(null);
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('zg_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfileId(data.id);
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
        const { data } = await supabase.functions.invoke('pwa-boot', {
          body: { 
            device: deviceId,
            lang: localStorage.getItem('zg.lang') || 'en'
          }
        });
        
        if (data?.ok) {
          setBootData(data);
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
