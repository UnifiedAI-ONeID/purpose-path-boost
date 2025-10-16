import { useAvailability } from '@/hooks/useAvailability';
import { invokeApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface BookCTAProps {
  slug: string;
  campaign?: string;
  prefill?: {
    name?: string;
    email?: string;
  };
}

export default function BookCTA({ slug, campaign = 'site', prefill }: BookCTAProps) {
  const { slots, loading } = useAvailability(slug, { days: 14 });

  async function handleBook() {
    try {
      const data = await invokeApi('/api/cal/book-url', {
        body: {
          slug,
          campaign,
          name: prefill?.name || '',
          email: prefill?.email || ''
        }
      });

      if (data?.ok && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        console.error('Booking error:', data?.error);
        toast.error('Unable to open booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to open booking');
    }
  }

  return (
    <div className="rounded-2xl border border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-card-foreground">Free Discovery Call</div>
          <div className="text-xs text-muted-foreground">Live availability from Cal.com</div>
        </div>
        <button 
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          onClick={handleBook}
        >
          See more times
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {loading ? (
          [0, 1, 2].map(i => (
            <div 
              key={i} 
              className="h-10 rounded-xl bg-muted animate-pulse"
            />
          ))
        ) : (
          slots.slice(0, 3).map((slot, i) => (
            <SlotPill key={i} iso={slot.start} onClick={handleBook} />
          ))
        )}
      </div>
    </div>
  );
}

interface SlotPillProps {
  iso: string;
  onClick: () => void;
}

function SlotPill({ iso, onClick }: SlotPillProps) {
  const date = new Date(iso);
  const label = date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <button
      onClick={onClick}
      className="h-10 px-3 rounded-xl border border-border bg-card text-sm hover:border-primary hover:bg-accent transition-colors active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
