import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';

type Suggestions = {
  headlines: Array<{ en: string; zh: string }>;
  hooks: string[];
  hashtags: { linkedin: string[]; instagram: string[]; x: string[] };
  when: { 'Asia/Shanghai': string[]; 'America/Vancouver': string[] };
  channels: string[];
  images: Array<{ idea: string; size: string }>;
  cta: string[];
  why: string;
};

interface PostAISuggestionsProps {
  post: {
    slug: string;
    title: string;
    excerpt?: string;
    tags?: string[];
  };
  onApplyTitle?: (title: string) => void;
  onApplyCaption?: (platform: string, text: string) => void;
}

export default function PostAISuggestions({ post, onApplyTitle, onApplyCaption }: PostAISuggestionsProps) {
  const [sug, setSug] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('heuristic');

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-suggestions', {
        body: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt || '',
          tags: post.tags || [],
        },
      });

      if (error) throw error;

      setSug(data.suggestions || null);
      setSource(data.source || 'heuristic');
      
      if (data.source === 'ai') {
        toast.success('AI suggestions generated');
      }
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (post.slug) {
      load();
    }
  }, [post.slug]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating AI suggestions...</span>
        </div>
      </Card>
    );
  }

  if (!sug) return null;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Content Suggestions</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Source: {source}</span>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Why / Trend insight */}
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>💡 Strategy:</strong> {sug.why}
        </p>
      </div>

      {/* Headlines */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Alternative Headlines (EN / 中文)</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {sug.headlines?.slice(0, 6).map((h, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-2">
              <div className="font-medium text-sm">{h.en}</div>
              <div className="text-sm text-muted-foreground">{h.zh}</div>
              {onApplyTitle && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => onApplyTitle(h.en)}>
                    Use EN
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onApplyTitle(h.zh)}>
                    用中文
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hooks */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Opening Hooks</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {sug.hooks?.slice(0, 6).map((hook, i) => (
            <div key={i} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
              <div className="text-sm flex-1">{hook}</div>
              {onApplyCaption && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApplyCaption('linkedin', hook)}
                >
                  Use
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Recommended Hashtags</h4>
        <div className="grid md:grid-cols-3 gap-3">
          {(['linkedin', 'instagram', 'x'] as const).map((platform) => (
            <div key={platform} className="border border-border rounded-lg p-3">
              <div className="font-medium text-xs mb-2 capitalize">{platform}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                {sug.hashtags[platform]?.map((tag, i) => (
                  <span key={i}>{tag}</span>
                ))}
              </div>
              {onApplyCaption && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => onApplyCaption(platform, sug.hashtags[platform].join(' '))}
                >
                  Apply
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timing & Channels */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Optimal Posting Times</h4>
          <div className="space-y-2 text-sm">
            <div>
              <div className="font-medium text-xs text-muted-foreground">Asia/Shanghai</div>
              <div className="text-xs">{sug.when['Asia/Shanghai']?.join(' · ')}</div>
            </div>
            <div>
              <div className="font-medium text-xs text-muted-foreground">America/Vancouver</div>
              <div className="text-xs">{sug.when['America/Vancouver']?.join(' · ')}</div>
            </div>
          </div>
        </div>
        <div className="border border-border rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Recommended Channels</h4>
          <div className="flex flex-wrap gap-2">
            {sug.channels?.map((channel, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-muted text-xs capitalize">
                {channel}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Image Ideas */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Cover Image Ideas</h4>
        <div className="grid md:grid-cols-3 gap-3">
          {sug.images?.map((img, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">{img.size}</div>
              <div className="text-sm">{img.idea}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Call-to-Action Options</h4>
        <div className="flex flex-wrap gap-2">
          {sug.cta?.map((cta, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => onApplyCaption?.('linkedin', `${cta}`)}
            >
              {cta}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
