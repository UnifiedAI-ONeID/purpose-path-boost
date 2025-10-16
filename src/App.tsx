import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import i18n from './i18n';
import { MainLayout } from './layouts/MainLayout';
import AppShell from './layouts/AppShell';
import { useEffect, useState } from 'react';
import Startup from './components/Startup';
import InstallPrompt from './components/InstallPrompt';
import { GlobalHead } from './components/GlobalHead';
import Home from "./pages/Home";
import MobileHome from "./pages/MobileHome";
import About from "./pages/About";
import CoachingPrograms from "./pages/CoachingPrograms";
import Quiz from "./pages/Quiz";
import BlogList from "./pages/BlogList";
import MobileBlog from "./pages/MobileBlog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import Book from "./pages/Book";
import MobileBook from "./pages/MobileBook";
import MobileMe from "./pages/MobileMe";
import BookSession from "./pages/BookSession";
import { isChinaBuild } from './lib/region';
import { lazy, Suspense } from 'react';

// Lazy load China-specific components
const BookSessionCN = lazy(() => import('./pages/BookSession.cn'));

// Choose booking component based on region
const BookingPage = isChinaBuild() ? BookSessionCN : BookSession;
import ThankYou from "./pages/ThankYou";
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
  const BookPage = isMobile ? MobileBook : Book;
  const BlogPage = isMobile ? MobileBlog : BlogList;
  const MePage = isMobile ? MobileMe : About;

  return (
    <>
      <GlobalHead />
      <Routes>
        {/* Startup splash screen */}
        <Route path="/" element={<Startup />} />
        
        {/* Standalone routes (no layout) */}
        <Route path="/install" element={<Install />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/events/:slug" element={<AdminEventEdit />} />
        <Route path="/admin/calendar" element={<AdminCalendar />} />
        <Route path="/admin/cal-bookings" element={<AdminCalBookings />} />
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/express" element={<AdminExpress />} />
        <Route path="/admin/ai" element={<AdminAI />} />
        
        {/* Public routes with responsive layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={isMobile ? <MePage /> : <About />} />
        <Route path="/coaching" element={<CoachingPrograms />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/coaching/:slug" element={<CoachingDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/book-session" element={
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </I18nextProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
