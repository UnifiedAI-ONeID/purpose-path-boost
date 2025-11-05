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
      
      // Route by device type only - no admin subdomain checks
      console.log('[Startup] Routing by device type');
      
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
