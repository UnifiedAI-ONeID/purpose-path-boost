import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  avatar_url?: string;
}

export default function Testimonials() {
  const [rows, setRows] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('api-testimonials-list');
        
        if (error) {
          console.error('Testimonials error:', error);
          return;
        }
        
        if (data?.ok && Array.isArray(data.rows)) {
          setRows(data.rows);
        } else {
          console.error('Invalid testimonials response:', data);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      }
    })();
  }, []);

  if (!rows.length) return null;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {rows.map((t) => (
        <div 
          key={t.id} 
          className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            {t.avatar_url && (
              <img
                src={t.avatar_url}
                alt={`${t.name} avatar`}
                className="h-12 w-12 rounded-full border-2 border-primary/20 object-cover"
                loading="lazy"
                onError={(e) => {
                  // Hide broken image gracefully
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <div className="font-semibold text-card-foreground">{t.name}</div>
              {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            &ldquo;{t.quote}&rdquo;
          </p>
        </div>
      ))}
    </div>
  );
}
