import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logout } from '@/lib/auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeApi } from '@/lib/api-client';

export default function HeaderUser() {
  const { lang } = usePrefs();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      
      // Defer admin check to avoid blocking the auth callback
      if (newSession?.user) {
        setTimeout(() => {
          checkAdminStatus();
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus() {
    try {
      const data = await invokeApi('/api/admin/check-role');
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

  const avatar = user.user_metadata?.avatar_url || '/assets/brand/mark.svg';
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account';

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
