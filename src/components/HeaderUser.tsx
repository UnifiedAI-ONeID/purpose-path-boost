
import React, { useEffect, useState, useRef } from 'react';
import { authClient, AppUser } from '@/auth';
import { logout } from '@/lib/auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeApi } from '@/lib/api-client';

interface SupabaseSession {
    user: AppUser | null;
}

interface SupabaseSubscription {
  unsubscribe: () => void;
}

interface SupabaseAuthClient {
  onAuthStateChange: (callback: (event: string, session: SupabaseSession | null) => void) => { data: { subscription: SupabaseSubscription } };
  getSession: () => Promise<{ data: { session: SupabaseSession | null } }>;
}

interface AdminCheckResponse {
  ok: boolean;
  is_admin: boolean;
}

// Simplified user types for properties accessed in this component
interface FirebaseUserProperties {
  photoURL?: string;
  displayName?: string;
}

interface SupabaseUserProperties {
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
  email?: string;
}

export default function HeaderUser() {
  const { lang } = usePrefs();
  const [user, setUser] = useState<AppUser | null>(null);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';
    if (authProvider === 'firebase') {
      const unsubscribe = authClient.onAuthStateChanged((user: AppUser | null) => {
        setUser(user);
        if (user) {
          setTimeout(() => {
            checkAdminStatus();
          }, 0);
        } else {
          setIsAdmin(false);
        }
      });
      return () => unsubscribe();
    } else {
      // Cast authClient to SupabaseAuthClient to access Supabase-specific methods
      const supabaseAuth = authClient as unknown as SupabaseAuthClient;
      if (typeof supabaseAuth.onAuthStateChange === 'function') {
        const { data: { subscription } } = supabaseAuth.onAuthStateChange((_event: string, newSession: SupabaseSession | null) => {
          setUser(newSession?.user || null);
          if (newSession?.user) {
            setTimeout(() => {
              checkAdminStatus();
            }, 0);
          } else {
            setIsAdmin(false);
          }
        });

        supabaseAuth.getSession().then(({ data: { session } }: { data: { session: SupabaseSession | null }}) => {
          setUser(session?.user || null);
          if (session?.user) {
            setTimeout(() => {
              checkAdminStatus();
            }, 0);
          }
        });

        return () => subscription.unsubscribe();
      }
    }
    return () => {};
  }, []);

  async function checkAdminStatus() {
    try {
      const data: AdminCheckResponse = await invokeApi('/api/admin/check-role');
      if (data?.ok && data.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Admin check error:', err);
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Button variant="outline" asChild>
        <a href="/auth">
          {lang === 'zh-CN' ? '登录' : lang === 'zh-TW' ? '登入' : 'Login'}
        </a>
      </Button>
    );
  }

  const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';
  const avatar = authProvider === 'firebase' ? (user as FirebaseUserProperties).photoURL : (user as SupabaseUserProperties).user_metadata?.avatar_url || '/assets/brand/mark.svg';
  const displayName = authProvider === 'firebase' ? (user as FirebaseUserProperties).displayName : (user as SupabaseUserProperties).user_metadata?.full_name || (user as SupabaseUserProperties).email?.split('@')[0] || 'Account';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatar} alt={displayName} />
          <AvatarFallback>
            <UserIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm hidden sm:block">
          {lang === 'zh-CN' ? '账户' : lang === 'zh-TW' ? '帳戶' : 'Account'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg p-1 z-50"
          >
            <a
              href={isAdmin ? '/admin' : '/me'}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              {isAdmin 
                ? (lang === 'zh-CN' ? '管理员' : lang === 'zh-TW' ? '管理員' : 'Admin')
                : (lang === 'zh-CN' ? '仪表板' : lang === 'zh-TW' ? '儀表板' : 'Dashboard')
              }
            </a>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              {lang === 'zh-CN' ? '登出' : lang === 'zh-TW' ? '登出' : 'Logout'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
