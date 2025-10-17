import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';

export default function Content() {
  const [tab, setTab] = useState<'lessons' | 'blog'>('lessons');

  return (
    <AdminShell>
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'lessons' | 'blog')}>
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Lessons Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage video lessons, courses, and learning content.
            </p>
            <Button asChild>
              <Link to="/admin">Open Lesson Manager</Link>
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Blog & Cross-post</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage blog posts and publish to social media platforms.
            </p>
            <Button asChild>
              <Link to="/admin/content/blog">Open Blog Manager</Link>
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AdminShell>
  );
}
