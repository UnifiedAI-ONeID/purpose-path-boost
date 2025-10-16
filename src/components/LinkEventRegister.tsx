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
  return (
    <a className={`btn btn-cta ${className}`} href={`/events/${slug}#register`}>
      {children}
    </a>
  );
}
