import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
      <div className="text-center px-4">
        <h1 className="mb-4 text-9xl font-serif font-bold text-brand-accent">404</h1>
        <h2 className="mb-4 text-3xl font-serif font-semibold text-white">Page Not Found</h2>
        <p className="mb-8 text-xl text-white/80 max-w-md mx-auto">
          The path you're looking for doesn't exist. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Link to="/contact">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Contact Us
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
