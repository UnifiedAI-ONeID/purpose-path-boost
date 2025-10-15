import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { MainLayout } from './layouts/MainLayout';
import AppShell from './layouts/AppShell';
import { useEffect, useState } from 'react';
import Home from "./pages/Home";
import MobileHome from "./pages/MobileHome";
import About from "./pages/About";
import CoachingPrograms from "./pages/CoachingPrograms";
import Quiz from "./pages/Quiz";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import Book from "./pages/Book";
import MobileBook from "./pages/MobileBook";
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
import AdminDashboard from "./pages/AdminDashboard";

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

  return (
    <Routes>
      {/* Auth routes (no layout) */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<AdminDashboard />} />
      
      {/* Public routes with responsive layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/coaching" element={<CoachingPrograms />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
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
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
