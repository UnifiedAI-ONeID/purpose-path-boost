import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Startup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show branding briefly, then navigate to home
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
