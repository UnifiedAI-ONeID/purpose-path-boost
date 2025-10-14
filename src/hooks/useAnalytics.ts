import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/analytics';

export const usePageView = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent('pageview', {
      page: location.pathname,
      title: document.title,
    });
  }, [location]);
};
