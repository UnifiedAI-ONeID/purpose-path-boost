import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { PrefsProvider } from './prefs/PrefsProvider';
import RouteAnimHook from './components/RouteAnimHook';
import { MainLayout } from './layouts/MainLayout';
import AppShell from './layouts/AppShell';
import { useEffect, useState, lazy, Suspense } from 'react';
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
import BookSession from "./pages/BookSession";
import { isChinaBuild } from './lib/region';

// Lazy load China-specific components
const BookSessionCN = lazy(() => import('./pages/BookSession.cn'));

// Choose booking component based on region
const BookingPage = isChinaBuild() ? BookSessionCN : BookSession;
import ThankYou from "./pages/ThankYou";
import Pricing from "./pages/Pricing";
import Payment from "./pages/Payment";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import AdminDashboard from "./pages/AdminDashboard";
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
import AdminCoaching from "./pages/AdminCoaching";
import AdminCoupons from "./pages/AdminCoupons";
import AdminSEO from "./pages/AdminSEO";
import PricingSuccess from "./pages/PricingSuccess";
import AccountCancel from "./pages/AccountCancel";
import Dashboard from "./pages/Dashboard";
import MeDashboard from "./pages/MeDashboard";
import RequireAuth from "./components/RequireAuth";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Lazy load PWA screens and layout
const PWALayout = lazy(() => import("./pwa/PWALayout"));
const PWAHome = lazy(() => import("./pwa/screens/Home"));
const PWAQuiz = lazy(() => import("./pwa/screens/Quiz"));
const PWADashboard = lazy(() => import("./pwa/screens/Dashboard"));
const PWACoaching = lazy(() => import("./pwa/screens/Coaching"));

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
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
        <Route path="/admin/events/:slug" element={<ProtectedAdminRoute><AdminEventEdit /></ProtectedAdminRoute>} />
        <Route path="/admin/calendar" element={<ProtectedAdminRoute><AdminCalendar /></ProtectedAdminRoute>} />
        <Route path="/admin/cal-bookings" element={<ProtectedAdminRoute><AdminCalBookings /></ProtectedAdminRoute>} />
        <Route path="/admin/pricing" element={<ProtectedAdminRoute><AdminPricing /></ProtectedAdminRoute>} />
        <Route path="/admin/express" element={<ProtectedAdminRoute><AdminExpress /></ProtectedAdminRoute>} />
        <Route path="/admin/ai" element={<ProtectedAdminRoute><AdminAI /></ProtectedAdminRoute>} />
        <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
        <Route path="/admin/coaching" element={<ProtectedAdminRoute><AdminCoaching /></ProtectedAdminRoute>} />
        <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCoupons /></ProtectedAdminRoute>} />
        <Route path="/admin/seo" element={<ProtectedAdminRoute><AdminSEO /></ProtectedAdminRoute>} />
        
        {/* PWA routes with shared layout */}
        <Route path="/pwa" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PWALayout />
          </Suspense>
        }>
          <Route index element={
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <PWAHome />
            </Suspense>
          } />
          <Route path="home" element={
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <PWAHome />
            </Suspense>
          } />
          <Route path="quiz" element={
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <PWAQuiz />
            </Suspense>
          } />
          <Route path="dashboard" element={
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <PWADashboard />
            </Suspense>
          } />
          <Route path="coaching" element={
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <PWACoaching />
            </Suspense>
          } />
        </Route>
        
        {/* Public routes with responsive layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/me" element={<RequireAuth><MeDashboard /></RequireAuth>} />
        <Route path="/about" element={isMobile ? <MePage /> : <About />} />
        <Route path="/coaching" element={<CoachingPrograms />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/coaching/:slug" element={<CoachingDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/coaching-session" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
            <BookingPage />
          </Suspense>
        } />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/pay" element={<Payment />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    
    {/* PWA Install Prompt */}
    <InstallPrompt />
  </>
  );
}

const App = () => {
  // Initialize version guard AFTER React has mounted
  useEffect(() => {
    // Delay version guard to ensure React is fully initialized
    const timer = setTimeout(async () => {
      const { bootVersionGuard } = await import('./lib/versionGuard');
      bootVersionGuard({ pollMs: 60000 }); // Check every 60 seconds
    }, 3000); // 3 second delay for React initialization
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <PrefsProvider>
          <I18nextProvider i18n={i18n}>
            {/* Removed global TooltipProvider to prevent invalid hook call; tooltips still work without a global provider */}
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteAnimHook />
              <AppRoutes />
            </BrowserRouter>
            <div id="zg-homeclick-layer" aria-hidden="true" />
          </I18nextProvider>
        </PrefsProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
