import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHomeAnim } from '@/anim/animator';

export default function Startup() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    
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
  }, [navigate, isMobile]);

  return (
    <section className="startup">
      <div className="startup__logo">🍃</div>
      <div className="startup__tag">Grow with Clarity</div>
    </section>
  );
}
