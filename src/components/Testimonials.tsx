import { useEffect, useState } from 'react';

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
        const response = await fetch('/api/testimonials/list');
        const json = await response.json();
        setRows(json.rows || []);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      }
    })();
  }, []);

  if (!rows.length) return null;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {rows.map((t) => (
        <div key={t.id} className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={t.avatar_url || '/placeholder.svg'}
              alt={t.name}
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
            <div>
              <div className="font-medium text-card-foreground">{t.name}</div>
              {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
        </div>
      ))}
    </div>
  );
}
