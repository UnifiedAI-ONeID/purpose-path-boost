export default function HeroMobile() {
  return (
    <section className="rounded-2xl overflow-hidden relative mt-4">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 to-primary/5" aria-hidden="true" />

      <div className="p-6">
        <h1 className="text-2xl leading-tight font-bold">
          Clarity • Confidence • Consistency
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bilingual coaching (English/中文) — designed for mobile.
        </p>

        {/* Video teaser */}
        <VideoTeaser />
        
        <a 
          href="/coaching" 
          className="mt-4 w-full h-12 rounded-xl text-[15px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition inline-flex items-center justify-center"
        >
          Book a Free Call
        </a>
      </div>
    </section>
  );
}

function VideoTeaser() {
  const prefersReducedMotion = typeof window !== 'undefined' && 
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <div className="mt-4 rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
      <div className="text-center p-4">
        <div className="text-4xl mb-2">🎥</div>
        <p className="text-sm text-muted-foreground">Video intro coming soon</p>
      </div>
    </div>
  );
}