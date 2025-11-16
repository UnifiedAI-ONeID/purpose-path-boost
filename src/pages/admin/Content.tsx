import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { AdminBlogList } from '@/components/admin/AdminBlogList';
import ContentLeaderboard from '@/components/admin/ContentLeaderboard';
import { VersionControl } from '@/components/admin/VersionControl';
import { supabase } from '@/integrations/supabase/client';

export default function Content() {
  const [tab, setTab] = useState<'pages' | 'blog' | 'analytics'>('pages');
  const [topContent, setTopContent] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'analytics') {
      loadTopContent();
    }
  }, [tab]);

  async function loadTopContent() {
    try {
      const { data, error } = await supabase.rpc('content_leaderboard_30d');
      if (!error && data) {
        setTopContent(data);
      }
    } catch (error) {
      console.error('[Content] Failed to load top content:', error);
    }
  }

  return (
    <AdminShell>
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pages' | 'blog' | 'analytics')}>
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">About Page</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Edit About page content in EN/中文.
              </p>
              <Button asChild>
                <Link to="/about">View About</Link>
              </Button>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Coaching Pages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage coaching program landing pages.
              </p>
              <Button asChild>
                <Link to="/coaching">View Coaching</Link>
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blog">
          <AdminBlogList />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <VersionControl />
            <ContentLeaderboard rows={topContent} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </AdminShell>
  );
}
