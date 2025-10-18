import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHomeAnim } from '@/anim/animator';
import { supabase } from '@/integrations/supabase/client';

export default function Startup() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAndRedirect() {
      console.log('[Startup] Starting admin check and routing');
      
      // Detect if device is mobile
      const isMobile = window.innerWidth < 768 || 
                       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Show branding animation
      triggerHomeAnim(600);
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        console.log('[Startup] User is authenticated, checking admin status');
        
        // Check admin status
        try {
          const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`
            }
          });
          
          console.log('[Startup] Admin check result:', { adminData, adminError });
          
          if (!adminError && adminData?.is_admin === true) {
            console.log('[Startup] User is admin, redirecting to /admin');
            setTimeout(() => {
              navigate('/admin', { replace: true });
              setChecking(false);
            }, 1200);
            return;
          }
        } catch (error) {
          console.error('[Startup] Admin check failed:', error);
        }
      }
      
      // Not admin or not authenticated - route by device type
      console.log('[Startup] Routing by device type, isMobile:', isMobile);
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
