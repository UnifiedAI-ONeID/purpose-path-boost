import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import SmartLink from "@/components/SmartLink";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--grad-brand)' }}>
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full border" style={{ background: 'rgba(30, 92, 92, 0.2)', borderColor: 'var(--jade-500)' }}>
            <Compass className="w-16 h-16" style={{ color: 'var(--gold-500)' }} />
          </div>
        </div>
        <h1 className="text-7xl font-bold" style={{ 
          background: 'linear-gradient(to right, var(--jade-500), var(--gold-500))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>404</h1>
        <p className="text-xl" style={{ color: 'var(--ink-lo)' }}>Oops! This path doesn't exist yet</p>
        <p className="max-w-md mx-auto" style={{ color: 'var(--gray-500)' }}>
          It seems you've wandered off your purpose path. Let's get you back on track.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild variant="hero" size="lg">
            <SmartLink to="/home">
              <Home className="mr-2 h-5 w-5" />
              Go Home Now
            </SmartLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
