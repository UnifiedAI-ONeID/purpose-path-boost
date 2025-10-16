import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CoachingOffer {
  id: string;
  slug: string;
  title: string;
  summary: string;
  base_price_cents: number;
  base_currency: string;
  billing_type: string;
  score?: number;
}

export default function Coaching() {
  const { lang } = usePrefs();
  const [searchParams] = useSearchParams();
  const [offers, setOffers] = useState<CoachingOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tags = searchParams.get('tags') || '';
    
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.functions
        .invoke('pwa-coaching-recommend', {
          body: { lang, tags },
          headers: { 'Accept-Language': lang }
        })
        .then(({ data }) => {
          if (data?.ok) {
            setOffers(data.rows || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [lang, searchParams]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Recommended Programs</h1>
      <p className="text-muted-foreground mb-6">
        Based on your assessment, here are programs that match your growth needs.
      </p>

      <div className="grid gap-4">
        {offers.map((offer) => (
          <Card key={offer.id}>
            <CardHeader>
              <CardTitle>{offer.title}</CardTitle>
              <CardDescription>
                {offer.billing_type === 'free' ? 'Free' : 
                  `${offer.base_currency} ${(offer.base_price_cents / 100).toFixed(2)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{offer.summary}</p>
              <Button asChild className="w-full">
                <a href={`/coaching/${offer.slug}`}>Learn More</a>
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {offers.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No programs available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
