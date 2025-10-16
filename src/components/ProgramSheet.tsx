import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface Program {
  id: string;
  title: string;
  description: string;
  duration: string;
  overview: string;
  benefits: string[];
  reviews: Array<{ name: string; rating: number; text: string }>;
  faqs: Array<{ q: string; a: string }>;
}

interface ProgramSheetProps {
  open: boolean;
  onClose: () => void;
  program: Program | null;
}

export function ProgramSheet({ open, onClose, program }: ProgramSheetProps) {
  if (!open || !program) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto max-h-[85vh] flex flex-col animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="h-1.5 w-12 rounded-full bg-border mx-auto mt-3 mb-2" />
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-3 border-b border-border">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-fg">{program.title}</h3>
            <p className="text-sm text-muted mt-1">{program.duration}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start px-6 bg-transparent border-b rounded-none">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-semibold text-fg mb-2">About this program</h4>
                <p className="text-sm text-muted leading-relaxed">{program.overview}</p>
              </div>
              <div>
                <h4 className="font-semibold text-fg mb-2">What you get</h4>
                <ul className="space-y-2">
                  {program.benefits.map((benefit, i) => (
                    <li key={i} className="text-sm text-muted flex items-start">
                      <span className="text-accent mr-2">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="px-6 py-4 space-y-4">
              {program.reviews.map((review, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-fg">{review.name}</span>
                    <span className="text-accent">{'★'.repeat(review.rating)}</span>
                  </div>
                  <p className="text-sm text-muted">{review.text}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="faq" className="px-6 py-4 space-y-3">
              {program.faqs.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="cursor-pointer font-medium text-fg list-none flex items-center justify-between py-2">
                    {faq.q}
                    <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted pt-2 pb-3">{faq.a}</p>
                </details>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky CTA */}
        <div className="border-t border-border p-4 bg-surface">
          <Link to={`/coaching?program=${program.id}`}>
            <Button className="w-full h-12 bg-brand text-white hover:bg-brand/90 rounded-xl">
              Book this program
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
