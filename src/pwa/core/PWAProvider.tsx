import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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

  // Monitor online/offline status
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

  // Initialize auth state
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile ID
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

  // Boot PWA with device tracking
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
