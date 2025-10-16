import SmartLink from './SmartLink';
import { pathOf } from '@/nav/routes';
import { ROUTES } from '@/nav/routes';

/**
 * Event registration link component
 * Use this for event CTAs that open the registration sheet
 */
export default function LinkEventRegister({ 
  slug, 
  children = 'Register', 
  className = '' 
}: {
  slug: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const path = `${pathOf(ROUTES.eventDetail, { slug })}#register`;
  
  return (
    <SmartLink 
      to={path}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-cta text-surface hover:bg-cta/90 shadow-medium hover:shadow-strong transition-smooth font-semibold h-10 px-4 py-2 ${className}`}
    >
      {children}
    </SmartLink>
  );
}
