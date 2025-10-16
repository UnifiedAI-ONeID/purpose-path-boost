import { usePrefs } from '@/prefs/PrefsProvider';
import { triggerHomeAnim } from '@/anim/animator';

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
};

/**
 * Smart link that automatically appends current language to URL
 * Preserves existing query parameters
 */
export default function SmartLink({ href, children, className, target, rel, ...rest }: Props) {
  const { lang } = usePrefs();
  
  // Build URL with lang parameter
  const getHref = () => {
    try {
      const u = new URL(href, window.location.origin);
      if (!u.searchParams.get('lang')) {
        u.searchParams.set('lang', lang);
      }
      return `${u.pathname}${u.search}${u.hash}`;
    } catch {
      // If URL parsing fails, return as-is
      return href;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Trigger animation on internal navigation
    if (!target || target === '_self') {
      triggerHomeAnim(600);
    }
  };

  return (
    <a 
      href={getHref()} 
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
