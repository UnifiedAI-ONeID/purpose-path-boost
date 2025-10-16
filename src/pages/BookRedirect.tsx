import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function BookRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const slug = searchParams.get('slug');
    
    if (slug) {
      // Redirect to specific coaching page
      navigate(`/coaching/${slug}`, { replace: true });
    } else {
      // Redirect to coaching landing page
      navigate('/coaching', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
