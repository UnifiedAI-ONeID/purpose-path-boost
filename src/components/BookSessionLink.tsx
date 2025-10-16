/**
 * Reusable booking link component
 * Points to /coaching/[slug] (canonical booking URLs)
 */
export default function BookSessionLink({
  slug = 'discovery-20',
  children = 'Book a session',
  className = '',
}: {
  slug?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={`btn btn-primary ${className}`} href={`/coaching/${slug}`}>
      {children}
    </a>
  );
}
