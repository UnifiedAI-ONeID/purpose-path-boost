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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/20 rounded-full border border-emerald-500/30">
            <Compass className="w-16 h-16 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-emerald-200">Oops! This path doesn't exist yet</p>
        <p className="text-emerald-300/70 max-w-md mx-auto">
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
