import React from 'react';
import { useNav } from '../nav/useNav';

type Props = React.ComponentProps<'a'> & { 
  to: string; 
  params?: Record<string, string | number | undefined>; 
  replace?: boolean; 
  animate?: boolean;
};

/**
 * Smart link that automatically appends current language to URL
 * Preserves existing query parameters and handles ref/utm tracking
 */
export default function SmartLink({ to, params, replace, animate, onClick, children, ...rest }: Props) {
  const nav = useNav();
  const url = nav.href(to, params);
  
  return (
    <a
      {...rest}
      href={url}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (!e.defaultPrevented && e.button === 0 && !(e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)) {
          e.preventDefault();
          (replace ? nav.replace : nav.push)(url, { animate });
        }
      }}
    >
      {children}
    </a>
  );
}
