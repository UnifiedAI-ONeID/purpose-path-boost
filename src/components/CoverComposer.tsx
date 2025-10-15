import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLATFORM_DISPLAY_NAMES, PlatKey } from '@/lib/og/sizes';
import { Loader2, Download, ExternalLink } from 'lucide-react';

const KEYS: PlatKey[] = ['linkedin', 'facebook', 'x', 'ig_square', 'ig_portrait', 'story'];
const TAGS = ['mindset','confidence','clarity','consistency','habits','leadership','career',
              'relationships','wellness','spirituality','money','productivity','自信','清晰','一致性','職涯','關係'];

interface CoverComposerProps {
  post: {
    title: string;
    slug: string;
    excerpt?: string;
    tags?: string[];
  };
}

export default function CoverComposer({ post }: CoverComposerProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'zh-CN' | 'zh-TW'>('en');
  const [tag, setTag] = useState<string>(post.tags?.[0] || 'mindset');
  const [imgs, setImgs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function genAll() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('og-render-all', {
        body: {
          title: post.title,
          subtitle: post.excerpt || '',
          slug: post.slug,
          theme,
          lang,
          tag,
        },
      });

      if (error) throw error;

      const map: Record<string, string> = {};
      (data?.images || []).forEach((it: any) => {
        if (it.ok) map[it.key] = it.url;
      });

      setImgs(map);
      toast.success(`Generated ${Object.keys(map).length} cover images`);
    } catch (error: any) {
      console.error('Error generating covers:', error);
      toast.error(error.message || 'Failed to generate covers');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cover Image Generator</h3>
          <p className="text-sm text-muted-foreground">
            Auto-generate platform-optimized cover images
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tag-select" className="text-sm">Tag:</Label>
            <select
              id="tag-select"
              className="px-3 py-1 rounded-md border border-border bg-background"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="theme-select" className="text-sm">Theme:</Label>
            <select
              id="theme-select"
              className="px-3 py-1 rounded-md border border-border bg-background"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="lang-select" className="text-sm">Lang:</Label>
            <select
              id="lang-select"
              className="px-3 py-1 rounded-md border border-border bg-background"
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
            >
              <option value="en">EN</option>
              <option value="zh-CN">简体</option>
              <option value="zh-TW">繁體</option>
            </select>
          </div>
          <Button onClick={genAll} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate All'
            )}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {KEYS.map((k) => (
          <div key={k} className="border border-border rounded-lg overflow-hidden">
            <div className="p-2 bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{PLATFORM_DISPLAY_NAMES[k]}</span>
                {imgs[k] && (
                  <div className="flex gap-1">
                    <a
                      href={imgs[k]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-background rounded"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={imgs[k]}
                      download={`${post.slug}-${k}.png`}
                      className="p-1 hover:bg-background rounded"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="aspect-video bg-muted/30 flex items-center justify-center">
              {imgs[k] ? (
                <img
                  src={imgs[k]}
                  alt={PLATFORM_DISPLAY_NAMES[k]}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sm text-muted-foreground">Not generated</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(imgs).length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✓ Images uploaded to storage and will be automatically used in social media posts
          </p>
        </div>
      )}
    </Card>
  );
}
