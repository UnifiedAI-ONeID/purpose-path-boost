
import { useState } from 'react';
import { db, functions } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Define function callable
const triggerSocialWorker = httpsCallable(functions, 'social-worker');

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
      // TODO: Update image URL logic for Firebase Storage
      // For now, using a placeholder pattern or the provided image_url
      const baseImageUrl = post.image_url || '';
      
      const promises = targets.map(async (p) => {
        const imagePath = baseImageUrl; // Simplified for now
        
        const postData = {
          blog_slug: post.slug,
          platform: p,
          message: `${post.title}\n\n${post.excerpt || ''}`,
          media: imagePath ? [{ type: 'image', url: imagePath }] : [],
          tags: post.tags || [],
          primary_tag: (post.tags && post.tags[0]) || null,
          created_at: serverTimestamp(),
          status: 'pending'
        };

        return addDoc(collection(db, 'social_posts'), postData);
      });

      await Promise.all(promises);

      toast.success(`Queued ${promises.length} post(s) for publishing`);
      
      // Trigger worker to process queue
      triggerSocialWorker().catch(console.error);

    } catch (error) {
      console.error('Error queueing posts:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to queue posts');
      } else {
        toast.error('An unknown error occurred while queueing posts');
      }
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
