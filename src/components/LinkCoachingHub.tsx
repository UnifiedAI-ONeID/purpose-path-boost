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
    <a className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${className}`} href="/coaching">
      {children}
    </a>
  );
}
