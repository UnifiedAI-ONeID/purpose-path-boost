
import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/trackEvent';
import { ChevronRight, Globe, Bell, Calendar, LogOut, User, Loader2 } from 'lucide-react';
import { AppUser, authClient } from '@/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { db } from '@/firebase/config';
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Timestamp;
}

interface Booking {
  id: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: string;
  meetingUrl?: string;
}

export default function MobileMe() {
  const [user, setUser] = useState<AppUser | null>(null);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showBookingsSheet, setShowBookingsSheet] = useState(false);
  
  // Live data state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page: 'mobile_me' });
    
    const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';
    if (authProvider === 'firebase') {
      const unsubscribe = authClient.onAuthStateChanged((user: AppUser | null) => {
        setUser(user);
      });
      return () => unsubscribe();
    } else {
      const supabaseAuth = authClient as any;
      if (typeof supabaseAuth.onAuthStateChange === 'function') {
        const { data: { subscription } } = supabaseAuth.onAuthStateChange((_: any, newSession: any) => {
          setUser(newSession?.user ?? null);
        });

        supabaseAuth.getSession().then(({ data: { session } }: any) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      }
    }
    return () => {};
  }, []);

  // Fetch notifications when sheet opens
  useEffect(() => {
    if (showNotificationsSheet && user) {
      fetchNotifications();
    }
  }, [showNotificationsSheet, user]);

  // Fetch bookings when sheet opens
  useEffect(() => {
    if (showBookingsSheet && user) {
      fetchBookings();
    }
  }, [showBookingsSheet, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoadingNotifications(true);
      const notifRef = collection(db, `users/${user.uid}/notifications`);
      const notifQuery = query(
        notifRef,
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(notifQuery);
      const notifs: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        message: doc.data().message || '',
        type: doc.data().type || 'info',
        read: doc.data().read || false,
        createdAt: doc.data().createdAt,
      }));
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoadingBookings(true);
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(
        bookingsRef,
        where('userId', '==', user.uid),
        orderBy('startTime', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(bookingsQuery);
      const bookingsData: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Coaching Session',
        startTime: doc.data().startTime,
        endTime: doc.data().endTime,
        status: doc.data().status || 'confirmed',
        meetingUrl: doc.data().meetingUrl,
      }));
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const formatBookingDate = (timestamp: Timestamp): string => {
    if (!timestamp) return 'Date TBD';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatNotificationTime = (timestamp: Timestamp): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
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
                {(user as any)?.email || 'Guest'}
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

      {showNotificationsSheet && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowNotificationsSheet(false)}>
          <div 
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto p-6 animate-slide-in-bottom max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg mb-4">Notifications</h3>
            
            {loadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-10 w-10 mx-auto mb-3 text-muted/40" />
                <p className="text-sm text-muted">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-xl border ${notif.read ? 'border-border bg-surface' : 'border-brand/20 bg-brand/5'}`}
                  >
                    <p className="text-sm text-fg">{notif.message}</p>
                    <p className="text-xs text-muted mt-1">{formatNotificationTime(notif.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showBookingsSheet && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowBookingsSheet(false)}>
          <div 
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto p-6 animate-slide-in-bottom max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg mb-4">Past Bookings</h3>
            
            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted/40" />
                <p className="text-sm text-muted">No bookings yet</p>
                <button
                  onClick={() => {
                    setShowBookingsSheet(false);
                    navigate('/book');
                  }}
                  className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium"
                >
                  Book a Session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 rounded-xl border border-border bg-surface">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-fg">{booking.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{formatBookingDate(booking.startTime)}</p>
                    {booking.meetingUrl && booking.status === 'confirmed' && (
                      <a 
                        href={booking.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-brand hover:underline"
                      >
                        Join Meeting →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
