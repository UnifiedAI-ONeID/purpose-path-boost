import SmartLink from './SmartLink';
import { pathOf } from '@/nav/routes';

/**
 * Standard coaching program link component
 * Use this for any CTA that directs to a specific coaching program
 */
export default function LinkCoaching({ 
  slug = 'discovery-60', 
  children = 'Book a session', 
  className = '' 
}: {
  slug?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <SmartLink 
      to={pathOf('/coaching/[slug]', { slug })} 
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-cta text-surface hover:bg-cta/90 shadow-medium hover:shadow-strong transition-smooth font-semibold h-10 px-4 py-2 ${className}`}
    >
      {children}
    </SmartLink>
  );
}
