import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHomeAnim } from '@/anim/animator';

export default function Startup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Detect if device is mobile
    const isMobile = window.innerWidth < 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Show branding animation, then navigate
    triggerHomeAnim(600);
    const timer = setTimeout(() => {
      // Route mobile devices to PWA, desktop to regular home
      if (isMobile) {
        navigate('/pwa/home');
      } else {
        navigate('/home');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="startup">
      <div className="startup__logo">🍃</div>
      <div className="startup__tag">Grow with Clarity</div>
    </section>
  );
}
