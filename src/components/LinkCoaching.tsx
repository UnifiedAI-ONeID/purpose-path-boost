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
    <a className={`btn btn-cta ${className}`} href={`/coaching/${slug}`}>
      {children}
    </a>
  );
}
