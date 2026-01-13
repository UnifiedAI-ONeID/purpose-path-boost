import { Sparkles, Play, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function HeroMobile() {
  return (
    <section className="rounded-2xl overflow-hidden relative mt-4">
      {/* Gradient background - Jade & Gold theme */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-jade-800 via-jade-700 to-jade-600" aria-hidden="true" />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-gold-400" />
          <span className="text-gold-400 text-sm font-medium">Transform Your Life</span>
        </div>
        
        <h1 className="text-2xl leading-tight font-bold text-white">
          Clarity • Confidence • Consistency
        </h1>
        <p className="text-sm text-white/70 mt-2">
          Bilingual coaching (English/中文) — designed for mobile.
        </p>

        {/* Video/Image Hero */}
        <HeroMedia />
        
        <a 
          href="/coaching" 
          className="mt-4 w-full h-12 rounded-xl text-[15px] font-semibold bg-gold-500 text-jade-900 hover:bg-gold-400 transition inline-flex items-center justify-center gap-2"
        >
          Book a Free Call
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function HeroMedia() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Check if coach hero image exists
  const heroImageUrl = '/assets/coach-hero.jpg';
  
  if (isPlaying) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden aspect-video">
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
          title="Coach Introduction"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  
  return (
    <div 
      className="mt-4 rounded-xl overflow-hidden aspect-video relative cursor-pointer group"
      onClick={() => setIsPlaying(true)}
    >
      {/* Hero Image or Gradient Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-jade-600 to-jade-800">
        <img 
          src={heroImageUrl}
          alt="Life Coach"
          className="w-full h-full object-cover opacity-80"
          onError={(e) => {
            // Hide broken image
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
      
      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gold-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="h-8 w-8 text-jade-900 ml-1" fill="currentColor" />
        </div>
      </div>
      
      {/* Caption */}
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-white text-sm font-medium drop-shadow-lg">
          Watch: Your Journey to Growth
        </p>
      </div>
    </div>
  );
}