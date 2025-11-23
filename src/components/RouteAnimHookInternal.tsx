import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { triggerHomeAnim } from '../anim/animator';

export default function RouteAnimHookInternal() {
  const location = useLocation();

  useEffect(() => {
    triggerHomeAnim(700);
  }, [location?.pathname]);

  return null;
}
