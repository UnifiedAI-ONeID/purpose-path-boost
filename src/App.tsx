import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { PrefsProvider } from '@/prefs/PrefsProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { GoalProvider } from '@/contexts/GoalContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { CommunityProvider } from '@/contexts/CommunityContext';
import RouteAnimHook from './components/RouteAnimHook';
import { MainLayout } from './layouts/MainLayout';
import AppShell from './layouts/AppShell';
import Startup from './components/Startup';
import InstallPrompt from './components/InstallPrompt';
import { GlobalHead } from './components/GlobalHead';
import DeviceRouter from './components/DeviceRouter';
import Home from "./pages/Home";
import MobileHome from "./pages/MobileHome";
import About from "./pages/About";
import CoachingPrograms from "./pages/CoachingPrograms";
import Quiz from "./pages/Quiz";
import BlogList from "./pages/BlogList";
import MobileBlog from "./pages/MobileBlog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import MobileMe from "./pages/MobileMe";
import GoalsPage from "./pages/Goals";
import JournalPage from "./pages/Journal";
import InsightsPage from "./pages/Insights";
import BookSession from "./pages/BookSession";
import { isChinaBuild } from './lib/region';
import CommunityPage from "./pages/Community";
import ThankYou from "./pages/ThankYou";
import Pricing from "./pages/Pricing";
import Payment from "./pages/Payment";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import EventsList from "./pages/EventsList";
import EventDetail from "./pages/EventDetail";
import CoachingDetail from "./pages/CoachingDetail";
import AdminEvents from "./pages/AdminEvents";
import AdminEventEdit from "./pages/AdminEventEdit";
import AdminCalendar from "./pages/AdminCalendar";
import AdminCalBookings from "./pages/AdminCalBookings";
import AdminPricing from "./pages/AdminPricing";
import AdminExpress from "./pages/AdminExpress";
import AdminAI from "./pages/AdminAI";
import AdminBookings from "./pages/AdminBookings";
import AdminCalEventTypes from "./pages/AdminCalEventTypes";
import AdminCoupons from "./pages/AdminCoupons";
import AdminSEO from "./pages/AdminSEO";
import PricingSuccess from "./pages/PricingSuccess";
import AccountCancel from "./pages/AccountCancel";
import DashboardRedirect from "./pages/DashboardRedirect";
import MeDashboard from "./pages/MeDashboard";
import RequireAuth from "./components/RequireAuth";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// New admin pages
import AdminOverview from "./pages/admin/Overview";
import AdminLeads from "./pages/admin/Leads";
import AdminContent from "./pages/admin/Content";
import AdminMarketing from "./pages/admin/Marketing";
import AdminPayments from "./pages/admin/Payments";
import AdminIntegrations from "./pages/admin/Integrations";
import AdminSystem from "./pages/admin/System";
import AdminCoachingNew from "./pages/admin/Coaching";
import CouponsManager from "./pages/admin/CouponsManager";
import ReferralsManager from "./pages/admin/ReferralsManager";
import CrossPostStudio from "./pages/admin/CrossPostStudio";
import FunnelManager from "./pages/admin/Funnel";
import AdminCRM from "./pages/admin/CRM";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import DataHealth from "./pages/admin/DataHealth"; // Import new page
import AdminFAQs from "./pages/admin/FAQs"; // FAQ management
import AdminLessons from "./pages/admin/Lessons"; // Learning content
import AdminChallenges from "./pages/admin/Challenges"; // Community challenges
import AdminTestimonials from "./pages/admin/Testimonials"; // Customer testimonials
import AdminUsers from "./pages/admin/Users"; // User management

// PWA Core
import { PWAProvider } from "./pwa/core/PWAProvider";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary"; // Import ErrorBoundary

// Lazy load PWA screens and layout  
const EnhancedPWALayout = lazy(() => import("./pwa/layouts/EnhancedPWALayout"));
const EnhancedHome = lazy(() => import("./pwa/screens/EnhancedHome"));
const PWAQuiz = lazy(() => import("./pwa/screens/Quiz"));
const Goals = lazy(() => import("./pwa/screens/Goals"));
const AIChat = lazy(() => import("./pwa/screens/AIChat"));
const Content = lazy(() => import("./pwa/screens/Content"));
const PWAMeDashboard = lazy(() => import("./pwa/screens/MeDashboard"));
const PWACoaching = lazy(() => import("./pwa/screens/Coaching"));
const PWAAnalytics = lazy(() => import("./pwa/screens/Analytics"));
const PWASessions = lazy(() => import("./pwa/screens/Sessions"));
const PWASettings = lazy(() => import("./pwa/screens/Settings"));

// Lazy load China-specific components
const BookSessionCN = lazy(() => import('./pages/BookSession.cn'));

// Choose booking component based on region
const BookingPage = isChinaBuild() ? BookSessionCN : BookSession;

const queryClient = new QueryClient();

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

function AppRoutes() {
  const isMobile = useIsMobile();

  // Initialize all systems AFTER React has mounted safely
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Debug: detect multiple React copies
        import('react').then((R: typeof React)=> {
          console.log('[React Debug] version', R.version, 'sameRef', R.useState === React.useState);
        });

        // Import all initialization functions dynamically to avoid early execution
        const [
          { bootAnimOnLoad },
          { normalizeEntryUrl },
          { initAnalytics },
          { initSessionTracking },
          { injectAnalytics },
          { isChinaBuild },
          { bootVersionGuard },
          { initPerformanceTracking },
          { initCacheMonitoring },
          { initPwa }
        ] = await Promise.all([
          import('./anim/boot'),
          import('./nav/deeplink'),
          import('./lib/initAnalytics'),
          import('./analytics/events'),
          import('./lib/loaders'),
          import('./lib/region'),
          import('./lib/versionGuard'),
          import('./lib/pwa/performance'),
          import('./lib/pwa/cacheMonitor'),
          import('./lib/pwa/init')
        ]);

        // Initialize PWA modules
        initPwa();

        // Initialize PWA performance tracking
        initPerformanceTracking();

        // Initialize cache monitoring
        initCacheMonitoring();

        // Initialize global animation system
        bootAnimOnLoad();

        // Normalize entry URL with lang and ref/utm parameters
        normalizeEntryUrl();

        // Initialize analytics based on region
        if (!isChinaBuild()) {
          // Global build: Use Umami + PostHog + Metrics Tracker
          initAnalytics();
          initSessionTracking();
          console.log('[Metrics] Tracker initialized');
        } else {
          // China build: Inject Baidu Tongji
          injectAnalytics();
          
          // Session tracking for China analytics
          if (typeof window !== 'undefined') {
            const sessionStartTime = Date.now();
            
            window.addEventListener('beforeunload', () => {
              const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
              if (window._hmt) {
                window._hmt.push(['_trackEvent', 'engagement', 'session_duration', `${duration}s`, duration]);
              }
            });
          }
        }

        // Initialize version guard last
        setTimeout(() => {
          bootVersionGuard();
        }, 2000);

      } catch (error) {
        console.error('[App] Initialization error:', error);
      }
    };

    // Delay initialization to ensure React is fully ready
    const timer = setTimeout(initializeApp, 100);
    return () => clearTimeout(timer);
  }, []);

  // Determine which layout and pages to use
  const Layout = isMobile ? AppShell : MainLayout;
  const HomePage = isMobile ? MobileHome : Home;
  const BlogPage = isMobile ? MobileBlog : BlogList;
  const MePage = isMobile ? MobileMe : About;

  return (
    <>
      <GlobalHead />
      <DeviceRouter />
      <Routes>
        {/* Startup splash screen */}
        <Route path="/" element={<Startup />} />
        
        {/* Standalone routes (no layout) */}
        <Route path="/install" element={<Install />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing/success" element={<PricingSuccess />} />
        <Route path="/account/cancel" element={<AccountCancel />} />
        
        {/* Protected Admin Routes - Require authentication & admin role */}
        <Route path="/admin" element={<ProtectedAdminRoute><AdminOverview /></ProtectedAdminRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminOverview /></ProtectedAdminRoute>} />
        <Route path="/admin/crm" element={<ProtectedAdminRoute><AdminCRM /></ProtectedAdminRoute>} />
        <Route path="/admin/leads" element={<ProtectedAdminRoute><AdminLeads /></ProtectedAdminRoute>} />
        <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminAnalytics /></ProtectedAdminRoute>} />
        <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
        <Route path="/admin/content" element={<ProtectedAdminRoute><AdminContent /></ProtectedAdminRoute>} />
        <Route path="/admin/marketing" element={<ProtectedAdminRoute><AdminMarketing /></ProtectedAdminRoute>} />
        <Route path="/admin/marketing/coupons" element={<ProtectedAdminRoute><CouponsManager /></ProtectedAdminRoute>} />
        <Route path="/admin/marketing/referrals" element={<ProtectedAdminRoute><ReferralsManager /></ProtectedAdminRoute>} />
        <Route path="/admin/marketing/crosspost" element={<ProtectedAdminRoute><CrossPostStudio /></ProtectedAdminRoute>} />
        <Route path="/admin/marketing/funnel" element={<ProtectedAdminRoute><FunnelManager /></ProtectedAdminRoute>} />
        <Route path="/admin/payments" element={<ProtectedAdminRoute><AdminPayments /></ProtectedAdminRoute>} />
        <Route path="/admin/integrations" element={<ProtectedAdminRoute><AdminIntegrations /></ProtectedAdminRoute>} />
        <Route path="/admin/system" element={<ProtectedAdminRoute><AdminSystem /></ProtectedAdminRoute>} />
        <Route path="/admin/health" element={<ProtectedAdminRoute><DataHealth /></ProtectedAdminRoute>} />
        
        {/* Legacy admin routes - keep for backward compatibility */}
        <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
        <Route path="/admin/events/:slug" element={<ProtectedAdminRoute><AdminEventEdit /></ProtectedAdminRoute>} />
        <Route path="/admin/calendar" element={<ProtectedAdminRoute><AdminCalendar /></ProtectedAdminRoute>} />
        <Route path="/admin/cal-bookings" element={<ProtectedAdminRoute><AdminCalBookings /></ProtectedAdminRoute>} />
        <Route path="/admin/pricing" element={<ProtectedAdminRoute><AdminPricing /></ProtectedAdminRoute>} />
        <Route path="/admin/express" element={<ProtectedAdminRoute><AdminExpress /></ProtectedAdminRoute>} />
        <Route path="/admin/ai" element={<ProtectedAdminRoute><AdminAI /></ProtectedAdminRoute>} />
        <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
        <Route path="/admin/coaching" element={<ProtectedAdminRoute><AdminCoachingNew /></ProtectedAdminRoute>} />
        <Route path="/admin/faqs" element={<ProtectedAdminRoute><AdminFAQs /></ProtectedAdminRoute>} />
        <Route path="/admin/lessons" element={<ProtectedAdminRoute><AdminLessons /></ProtectedAdminRoute>} />
        <Route path="/admin/challenges" element={<ProtectedAdminRoute><AdminChallenges /></ProtectedAdminRoute>} />
        <Route path="/admin/testimonials" element={<ProtectedAdminRoute><AdminTestimonials /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
        <Route path="/admin/cal-event-types" element={<ProtectedAdminRoute><AdminCalEventTypes /></ProtectedAdminRoute>} />
        <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCoupons /></ProtectedAdminRoute>} />
        <Route path="/admin/seo" element={<ProtectedAdminRoute><AdminSEO /></ProtectedAdminRoute>} />
        
        {/* Enhanced PWA routes */}
        <Route path="/pwa" element={
          <Suspense fallback={<LoadingSpinner />}>
            <EnhancedPWALayout />
          </Suspense>
        }>
          <Route index element={<Suspense fallback={<LoadingSpinner />}><EnhancedHome /></Suspense>} />
          <Route path="home" element={<Suspense fallback={<LoadingSpinner />}><EnhancedHome /></Suspense>} />
          <Route path="goals" element={<Suspense fallback={<LoadingSpinner />}><Goals /></Suspense>} />
          <Route path="ai" element={<Suspense fallback={<LoadingSpinner />}><AIChat /></Suspense>} />
          <Route path="content" element={<Suspense fallback={<LoadingSpinner />}><Content /></Suspense>} />
          <Route path="me" element={<Suspense fallback={<LoadingSpinner />}><PWAMeDashboard /></Suspense>} />
          <Route path="quiz" element={<Suspense fallback={<LoadingSpinner />}><PWAQuiz /></Suspense>} />
          <Route path="coaching" element={<Suspense fallback={<LoadingSpinner />}><PWACoaching /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<LoadingSpinner />}><PWAAnalytics /></Suspense>} />
          <Route path="sessions" element={<Suspense fallback={<LoadingSpinner />}><PWASessions /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<LoadingSpinner />}><PWASettings /></Suspense>} />
          <Route path="dashboard" element={<Suspense fallback={<LoadingSpinner />}><PWAMeDashboard /></Suspense>} />
        </Route>
        
        {/* Public routes with responsive layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/me" element={<RequireAuth><MeDashboard /></RequireAuth>} />
          <Route path="/goals" element={<RequireAuth><GoalsPage /></RequireAuth>} />
          <Route path="/journal" element={<RequireAuth><JournalPage /></RequireAuth>} />
          <Route path="/insights" element={<RequireAuth><InsightsPage /></RequireAuth>} />
          <Route path="/community" element={<RequireAuth><CommunityPage /></RequireAuth>} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/about" element={isMobile ? <MePage /> : <About />} />
          <Route path="/coaching" element={<CoachingPrograms />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/coaching/:slug" element={<CoachingDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/coaching-session" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
              <BookingPage />
            </Suspense>
          } />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/pay" element={<Payment />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    
    {/* PWA Install Prompt */}
    <InstallPrompt />
  </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <PrefsProvider>
          <PWAProvider>
            <AuthProvider>
              <GoalProvider>
                <JournalProvider>
                  <CommunityProvider>
                    <I18nextProvider i18n={i18n}>
                      <ErrorBoundary>
                        <BrowserRouter>
                          <RouteAnimHook />
                          <AppRoutes />
                          <Toaster />
                          <Sonner />
                        </BrowserRouter>
                      </ErrorBoundary>
                      <div id="zg-homeclick-layer" aria-hidden="true" />
                    </I18nextProvider>
                  </CommunityProvider>
                </JournalProvider>
              </GoalProvider>
            </AuthProvider>
          </PWAProvider>
        </PrefsProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
