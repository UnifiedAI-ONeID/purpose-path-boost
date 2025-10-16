import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { triggerHomeAnim } from '../anim/animator';

export default function RouteAnimHook() {
  // Add error boundary for router context
  let location;
  try {
    location = useLocation();
  } catch (error) {
    console.warn('RouteAnimHook: Router context not ready', error);
    return null;
  }

  useEffect(() => {
    // Only trigger if we have a valid location
    if (location?.pathname) {
      triggerHomeAnim(700);
    }
  }, [location?.pathname]);

  return null;
}
