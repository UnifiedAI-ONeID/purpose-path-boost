import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';

export default function Content() {
  const [tab, setTab] = useState<'pages' | 'blog'>('pages');

  return (
    <AdminShell>
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pages' | 'blog')}>
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
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
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Blog & Cross-post</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage blog posts and publish to social media platforms.
            </p>
            <Button asChild>
              <Link to="/admin/marketing/crosspost">Open Cross-post Studio</Link>
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AdminShell>
  );
}
