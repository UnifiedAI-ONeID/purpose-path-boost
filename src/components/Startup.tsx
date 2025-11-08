import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHomeAnim } from '@/anim/animator';
import { supabase } from '@/integrations/supabase/client';

export default function Startup() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAndRedirect() {
      console.log('[Startup] Starting routing logic');
      
      // Show branding animation
      triggerHomeAnim(600);
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        console.log('[Startup] User authenticated, checking admin status');
        
        // Check if user is admin
        try {
          const { data, error } = await supabase.functions.invoke('api-admin-check-role', {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`
            }
          });
          
          const isAdmin = !error && data?.is_admin === true;
          console.log('[Startup] Admin check result:', isAdmin);
          
          if (isAdmin) {
            console.log('[Startup] Redirecting admin to dashboard');
            setTimeout(() => {
              navigate('/admin', { replace: true });
              setChecking(false);
            }, 1200);
            return;
          }
        } catch (err) {
          console.error('[Startup] Error checking admin status:', err);
        }
      }
      
      // Not an admin or not authenticated - route by device type
      console.log('[Startup] Routing regular user by device type');
      
      const isMobile = window.innerWidth < 768 || 
                       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log('[Startup] Device type, isMobile:', isMobile);
      setTimeout(() => {
        if (isMobile) {
          navigate('/pwa/home', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
        setChecking(false);
      }, 1200);
    }

    checkAndRedirect();
  }, [navigate]);

  return (
    <section className="startup">
      <div className="startup__logo">🍃</div>
      <div className="startup__tag">Grow with Clarity</div>
    </section>
  );
}
