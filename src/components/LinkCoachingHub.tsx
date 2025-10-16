/**
 * Link to the coaching programs hub/listing page
 * Use this for "see all options" or "view coaching programs" CTAs
 */
export default function LinkCoachingHub({ 
  children = 'See all options', 
  className = '' 
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={`btn btn-ghost ${className}`} href="/coaching">
      {children}
    </a>
  );
}
