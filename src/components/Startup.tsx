import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHomeAnim } from '@/anim/animator';

export default function Startup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show branding animation, then navigate to home
    triggerHomeAnim(600);
    const timer = setTimeout(() => {
      navigate('/home');
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
