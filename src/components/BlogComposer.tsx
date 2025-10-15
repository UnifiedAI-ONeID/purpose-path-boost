import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface BlogComposerProps {
  post: {
    title: string;
    slug: string;
    excerpt: string;
    image_url?: string;
    tags?: string[];
  };
}

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'x', label: 'X (Twitter)', icon: '𝕏' },
  { id: 'wechat', label: 'WeChat', icon: '💬' },
  { id: 'red', label: 'RED', icon: '📕' },
  { id: 'zhihu', label: 'Zhihu', icon: '知' },
  { id: 'douyin', label: 'Douyin', icon: '🎵' },
];

export default function BlogComposer({ post }: BlogComposerProps) {
  const [targets, setTargets] = useState<string[]>(['linkedin', 'facebook']);
  const [loading, setLoading] = useState(false);

  function toggle(platformId: string) {
    setTargets(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  }

  async function shareAll() {
    if (targets.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setLoading(true);
    try {
      // Get generated cover images for this post
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const baseImageUrl = `${supabaseUrl}/storage/v1/object/public/social-images/${post.slug}`;
      
      const rows = targets.map(p => {
        // Map platform to image filename
        let imagePath = '';
        if (p === 'linkedin') imagePath = `${baseImageUrl}/linkedin.png`;
        else if (p === 'facebook') imagePath = `${baseImageUrl}/facebook.png`;
        else if (p === 'x') imagePath = `${baseImageUrl}/x.png`;
        else if (p === 'instagram') imagePath = `${baseImageUrl}/ig_portrait.png`;
        else if (p === 'wechat' || p === 'red' || p === 'zhihu' || p === 'douyin') {
          imagePath = `${baseImageUrl}/ig_square.png`; // Use square for Chinese platforms
        }

        return {
          blog_slug: post.slug,
          platform: p,
          message: `${post.title}\n\n${post.excerpt || ''}`,
          media: imagePath ? [{ type: 'image', url: imagePath }] : (post.image_url ? [{ type: 'image', url: post.image_url }] : []),
          tags: post.tags || [],
          primary_tag: (post.tags && post.tags[0]) || null,
        };
      });

      const { error } = await supabase.from('social_posts').insert(rows);

      if (error) throw error;

      toast.success(`Queued ${rows.length} post(s) for publishing`);
      
      // Trigger worker to process queue
      supabase.functions.invoke('social-worker').catch(console.error);
    } catch (error: any) {
      console.error('Error queueing posts:', error);
      toast.error(error.message || 'Failed to queue posts');
    } finally {
      setLoading(false);
    }
  }

  const hasChinese = targets.some(t => ['wechat', 'red', 'zhihu', 'douyin'].includes(t));

  return (
    <section className="rounded-xl bg-surface border border-border shadow-soft p-4 space-y-4">
      <h2 className="text-xl font-semibold">Cross-post to Social Media</h2>
      
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(platform => (
          <Button
            key={platform.id}
            variant={targets.includes(platform.id) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggle(platform.id)}
            className="gap-1"
          >
            <span>{platform.icon}</span>
            <span>{platform.label}</span>
          </Button>
        ))}
      </div>

      {hasChinese && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          ℹ️ WeChat/RED/Zhihu/Douyin will generate an Export Pack (ZIP) for manual upload.
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={shareAll} 
          disabled={loading || targets.length === 0}
          className="gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Queueing...
            </>
          ) : (
            <>
              <span>🚀</span>
              Share to {targets.length} platform{targets.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
