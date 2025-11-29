import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/edge';
import { toast } from 'sonner';

const PLATFORMS = ['linkedin', 'facebook', 'x', 'wechat', 'xiaohongshu', 'instagram'] as const;

export default function CrossPostStudio() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [link, setLink] = useState('');
  const [media, setMedia] = useState('');
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const { data, error } = await supabase.functions.invoke(
        'api-admin-crosspost-list',
        {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
        }
      );

      if (error) throw error;
      setQueue(data?.rows || []);
    } catch (error) {
      console.error('[CrossPostStudio] Fetch failed:', error);
    }
  }

  async function handleGenerateVariants() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const { data, error } = await supabase.functions.invoke(
        'api-admin-crosspost-variants',
        {
          body: { title, summary },
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
        }
      );

      if (error) throw error;
      setVariants(data?.variants || {});
      toast.success('Variants generated!');
    } catch (error) {
      console.error('[CrossPostStudio] Generate failed:', error);
      toast.error('Failed to generate variants');
    }
  }

  async function handleQueue(publishNow = false) {
    const items = PLATFORMS
      .filter(p => variants[p])
      .map(p => ({
        platform: p,
        title,
        body: variants[p],
        link_url: link || null,
        media_url: media || null,
        scheduled_at: publishNow ? null : null,
        locale: 'en'
      }));

    if (items.length === 0) {
      toast.error('No platform content to queue');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const { data, error } = await supabase.functions.invoke(
        'api-admin-crosspost-queue',
        {
          body: { items },
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
        }
      );

      if (error) throw error;
      toast.success('Posts queued!');
      fetchQueue();

      if (publishNow && data?.rows?.[0]?.id) {
        await handlePublish(data.rows[0].id);
      }
    } catch (error) {
      console.error('[CrossPostStudio] Queue failed:', error);
      toast.error('Failed to queue posts');
    }
  }

  async function handlePublish(queueId: string) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const { error } = await supabase.functions.invoke(
        'api-admin-crosspost-publish',
        {
          body: { queue_id: queueId },
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
        }
      );

      if (error) throw error;
      toast.success('Post published!');
      fetchQueue();
    } catch (error) {
      console.error('[CrossPostStudio] Publish failed:', error);
      toast.error('Failed to publish post');
    }
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Cross-Post Studio</h1>

        {/* Composer */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Compose</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Unlock Your Growth Potential"
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://zhengrowth.com/blog/..."
                />
              </div>
            </div>

            <div>
              <Label>Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Discover 3 powerful strategies to..."
                rows={3}
              />
            </div>

            <div>
              <Label>Media URL</Label>
              <Input
                value={media}
                onChange={(e) => setMedia(e.target.value)}
                placeholder="https://.../ poster.jpg"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerateVariants}>
                Generate Platform Variants
              </Button>
              <Button variant="outline" onClick={() => handleQueue(false)}>
                Queue Drafts
              </Button>
              <Button variant="outline" onClick={() => handleQueue(true)}>
                Publish First Now
              </Button>
            </div>
          </div>
        </Card>

        {/* Platform Variants */}
        {Object.keys(variants).length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => (
              <Card key={platform} className="p-4">
                <h4 className="font-medium capitalize mb-2">{platform}</h4>
                <Textarea
                  value={variants[platform] || ''}
                  onChange={(e) => setVariants({ ...variants, [platform]: e.target.value })}
                  placeholder={`Caption for ${platform}...`}
                  rows={5}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {platform === 'x' && 'Keep under 280 characters'}
                  {platform === 'linkedin' && 'Professional tone, use hashtags'}
                  {(platform === 'wechat' || platform === 'xiaohongshu') && 'Add line breaks + poster'}
                  {platform === 'instagram' && 'Visual focus + emojis'}
                  {platform === 'facebook' && 'Conversational style'}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Queue List */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Queue</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="capitalize">
                      <Badge variant="outline">{item.platform}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.title || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'posted' ? 'default' :
                          item.status === 'queued' ? 'secondary' :
                          'outline'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.published_at ? new Date(item.published_at).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      {item.status !== 'posted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(item.id)}
                        >
                          Publish
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
