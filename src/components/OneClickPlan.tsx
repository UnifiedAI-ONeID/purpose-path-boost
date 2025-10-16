import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Rocket, Sparkles } from 'lucide-react';
import { invokeApi } from '@/lib/api-client';

interface OneClickPlanProps {
  post: {
    slug: string;
    title: string;
    excerpt?: string;
    tags?: string[];
  };
  onHeadline?: (title: string) => void;
}

export default function OneClickPlan({ post, onHeadline }: OneClickPlanProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setBusy(true);
    try {
      const data = await invokeApi('/api/social/plan', {
        method: 'POST',
        body: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt || '',
          tags: post.tags || [],
          platforms: ['linkedin', 'facebook', 'instagram', 'x'],
          lang: 'en',
          theme: 'light'
        }
      });
      
      if (data.ok) {
        setResult(data);
        if (onHeadline) onHeadline(data.headline);
      } else {
        alert(data.error || 'Failed to plan');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to plan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-brand-accent/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-brand-accent" />
              <h3 className="text-lg font-semibold">One-Click Publish Plan</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered headline optimization, cover generation, caption building, and smart scheduling — all in one click.
            </p>
            
            {result && (
              <div className="space-y-3 text-sm border-t pt-4">
                <div>
                  <div className="font-medium mb-1">Optimized headline:</div>
                  <div className="text-muted-foreground">{result.headline}</div>
                </div>
                
                <div>
                  <div className="font-medium mb-1">Scheduled posts (UTC):</div>
                  <ul className="space-y-1">
                    {Object.entries(result.schedules || {}).map(([platform, time]) => (
                      <li key={platform} className="flex items-center gap-2">
                        <span className="capitalize font-medium">{platform}:</span>
                        <span className="text-muted-foreground">
                          {time 
                            ? new Date(time as string).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'UTC'
                              })
                            : 'ASAP'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Source: {result.source}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={run} 
            disabled={busy}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            {busy ? 'Planning...' : 'Plan & Queue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
