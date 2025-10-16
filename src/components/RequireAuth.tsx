import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(!!session);
      if (!session && event !== 'INITIAL_SESSION') {
        navigate(`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
    } else {
      setAuthenticated(true);
    }
    
    setChecking(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
