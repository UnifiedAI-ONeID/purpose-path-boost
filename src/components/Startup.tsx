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
      
      // Check if we're on admin subdomain
      const hostname = window.location.hostname;
      const isAdminSubdomain = hostname.startsWith('admin.') || hostname === 'admin.zhengrowth.com';
      
      console.log('[Startup] Hostname:', hostname, 'isAdminSubdomain:', isAdminSubdomain);
      
      // Show branding animation
      triggerHomeAnim(600);
      
      if (isAdminSubdomain) {
        // Admin subdomain logic
        console.log('[Startup] On admin subdomain, checking authentication');
        
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log('[Startup] User authenticated, verifying admin role');
          
          try {
            const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
              headers: {
                Authorization: `Bearer ${sessionData.session.access_token}`
              }
            });
            
            console.log('[Startup] Admin check result:', { adminData, adminError });
            
            if (!adminError && adminData?.is_admin === true) {
              console.log('[Startup] Admin verified, redirecting to admin.zhengrowth.com');
              setTimeout(() => {
                window.location.href = 'https://admin.zhengrowth.com';
              }, 1200);
              return;
            }
          } catch (error) {
            console.error('[Startup] Admin check failed:', error);
          }
        }
        
        // Not authenticated or not admin on admin subdomain
        console.log('[Startup] Not authenticated or not admin, redirecting to auth');
        setTimeout(() => {
          navigate('/auth?returnTo=/admin', { replace: true });
          setChecking(false);
        }, 1200);
        return;
      }
      
      // Main domain logic - route by device type only
      console.log('[Startup] On main domain, routing by device type');
      
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
