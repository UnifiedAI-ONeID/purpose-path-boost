import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TransitionOverlay from './TransitionOverlay';

export default function RouteTransitions() {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [prevPath, setPrevPath] = useState('');

  useEffect(() => {
    // Skip transition on initial load
    if (!prevPath) {
      setPrevPath(location.pathname);
      return;
    }

    // Skip if path hasn't changed (e.g., just hash or search params)
    if (location.pathname === prevPath) {
      return;
    }

    // Trigger transition overlay
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setPrevPath(location.pathname);
    }, 450);

    return () => clearTimeout(timer);
  }, [location.pathname, prevPath]);

  return <TransitionOverlay show={show} />;
}
