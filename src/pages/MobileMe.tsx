import { useState, useEffect } from 'react';
import { track } from '@/analytics/events';
import { ChevronRight, Globe, Bell, Calendar, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function MobileMe() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showBookingsSheet, setShowBookingsSheet] = useState(false);

  useEffect(() => {
    track('page_view', { page: 'mobile_me' });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setShowLanguageSheet(false);
    toast.success('Language updated');
  };

  const MenuItem = ({ icon: Icon, label, onClick }: any) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-4 bg-surface rounded-2xl border border-border hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-muted" />
        <span className="text-fg font-medium">{label}</span>
      </div>
      <ChevronRight size={20} className="text-muted" />
    </button>
  );

  return (
    <>
      <div className="min-h-screen bg-bg pb-20">
        <header className="p-6 pt-8 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg">
                {user?.email || 'Guest'}
              </h1>
              <p className="text-sm text-muted">
                {user ? 'Manage your account' : 'Sign in to continue'}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-3">
          {!user ? (
            <button
              onClick={() => navigate('/auth')}
              className="w-full h-12 rounded-xl bg-brand text-white hover:bg-brand/90 transition-all font-medium"
            >
              Sign In / Sign Up
            </button>
          ) : (
            <>
              <MenuItem 
                icon={Calendar} 
                label="Past Bookings" 
                onClick={() => setShowBookingsSheet(true)} 
              />
              <MenuItem 
                icon={Bell} 
                label="Notifications" 
                onClick={() => setShowNotificationsSheet(true)} 
              />
              <MenuItem 
                icon={Globe} 
                label="Language" 
                onClick={() => setShowLanguageSheet(true)} 
              />
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full p-4 bg-surface rounded-2xl border border-border hover:shadow-md transition-all text-red-500"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Language Sheet */}
      {showLanguageSheet && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowLanguageSheet(false)}>
          <div 
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto p-6 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg mb-4">Select Language</h3>
            <div className="space-y-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'zh-TW', label: '繁體中文' },
                { code: 'zh-CN', label: '简体中文' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="w-full p-4 text-left rounded-xl border border-border hover:bg-brand/5 transition-all"
                >
                  <span className="text-fg font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Sheet */}
      {showNotificationsSheet && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowNotificationsSheet(false)}>
          <div 
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto p-6 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg mb-4">Notifications</h3>
            <p className="text-sm text-muted">No notifications yet</p>
          </div>
        </div>
      )}

      {/* Bookings Sheet */}
      {showBookingsSheet && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowBookingsSheet(false)}>
          <div 
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto p-6 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg mb-4">Past Bookings</h3>
            <p className="text-sm text-muted">No bookings yet</p>
          </div>
        </div>
      )}
    </>
  );
}
