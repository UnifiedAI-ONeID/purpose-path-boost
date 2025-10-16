import SmartLink from './SmartLink';
import { pathOf } from '@/nav/routes';

/**
 * Reusable booking link component
 * Points to /coaching/[slug] (canonical booking URLs)
 */
export default function BookSessionLink({
  slug = 'discovery-60',
  children = 'Book a session',
  className = '',
}: {
  slug?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <SmartLink to={pathOf('/coaching/[slug]', { slug })} className={`btn btn-primary ${className}`}>
      {children}
    </SmartLink>
  );
}
