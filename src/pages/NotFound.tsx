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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-jade-900 via-jade-800 to-jade-900">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full border bg-jade-500/20 border-jade-500">
            <Compass className="w-16 h-16 text-gold-500" />
          </div>
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-jade-500 to-gold-500 bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-gray-300">Oops! This path doesn't exist yet</p>
        <p className="max-w-md mx-auto text-gray-500">
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
