import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { triggerHomeAnim } from '../anim/animator';

export default function RouteAnimHook() {
  const location = useLocation();

  useEffect(() => {
    // Trigger animation on route changes
    triggerHomeAnim(700);
  }, [location.pathname]);

  return null;
}
