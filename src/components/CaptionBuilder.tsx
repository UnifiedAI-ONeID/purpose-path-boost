import { useMemo, useState } from 'react';
import { buildCaption } from '@/lib/captions/templates';
import { SocialPlatform } from '@/lib/utm';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { db, functions } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';

const triggerSocialWorker = httpsCallable(functions, 'social-worker');

const PLATFORMS: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'x', 'youtube', 'wechat', 'red', 'zhihu', 'douyin'];

interface CaptionBuilderProps {
  post: {
    title: string;
    slug: string;
    excerpt?: string;
    tags?: string[];
    cover?: string;
  };
}

interface SocialPostPayload {
  blog_slug: string;
  platform: SocialPlatform;
  status: 'queued';
  message: string;
  media: { type: 'image'; url: string }[] | null;
  tags: string[];
  primary_tag: string | null;
  created_at: FieldValue;
}

export default function CaptionBuilder({ post }: CaptionBuilderProps) {
  const [lang, setLang] = useState<'en' | 'zh-CN' | 'zh-TW'>('en');
  const [targets, setTargets] = useState<SocialPlatform[]>(['linkedin', 'facebook', 'instagram', 'x']);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const previews = useMemo(() => {
    const out: Record<string, string> = {};
    for (const p of targets) {
      const { text } = buildCaption({
        platform: p,
        lang,
        title: post.title,
        summary: post.excerpt || '',
        slug: post.slug,
        tags: post.tags || []
      });
      out[p] = custom[p] ?? text;
    }
    return out;
  }, [targets, lang, post, custom]);

  async function queue() {
    if (targets.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setLoading(true);
    try {
      const promises = targets.map(async (p) => {
        const postData: SocialPostPayload = {
            blog_slug: post.slug,
            platform: p,
            status: 'queued',
            message: custom[p] ?? previews[p],
            media: post.cover ? [{ type: 'image', url: post.cover }] : null,
            tags: post.tags || [],
            primary_tag: (post.tags && post.tags[0]) || null,
            created_at: serverTimestamp()
        };
        return addDoc(collection(db, 'social_posts'), postData);
      });

      await Promise.all(promises);

      toast.success(`Queued ${promises.length} post(s) for cross-posting`);
      
      // Trigger worker
      triggerSocialWorker().catch((error: unknown) => {
        console.error('Error triggering social worker:', error);
      });
    } catch (error: unknown) {
      console.error('Error queueing posts:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to queue posts');
      } else {
        toast.error('An unknown error occurred while queueing posts.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Advanced Caption Builder</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="lang-select" className="text-sm">Language:</Label>
          <select 
            id="lang-select"
            className="px-3 py-1 rounded-md border border-border bg-background"
            value={lang} 
            onChange={e => setLang(e.target.value as 'en' | 'zh-CN' | 'zh-TW')}
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(p => (
          <Button
            key={p}
            variant={targets.includes(p) ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTargets(t => t.includes(p) ? t.filter(x => x !== p) : [...t, p])}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
      </div>

      {targets.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {targets.map(p => (
            <div key={p} className="space-y-2">
              <Label className="capitalize font-medium">{p} Preview</Label>
              <Textarea
                rows={6}
                value={custom[p] ?? previews[p]}
                onChange={e => setCustom(c => ({ ...c, [p]: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Edit to customize for this platform only
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={queue} 
          disabled={loading || targets.length === 0}
        >
          {loading ? 'Queueing...' : `Queue ${targets.length} Post${targets.length !== 1 ? 's' : ''}`}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setCustom({})}
          disabled={Object.keys(custom).length === 0}
        >
          Reset Overrides
        </Button>
      </div>
    </Card>
  );
}
