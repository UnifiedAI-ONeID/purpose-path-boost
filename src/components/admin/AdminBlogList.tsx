import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BlogEditor } from '@/components/BlogEditor';
import { supabase } from '@/db';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export function AdminBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredPosts(
        posts.filter(
          (post) =>
            post.title.toLowerCase().includes(searchLower) ||
            post.slug.toLowerCase().includes(searchLower) ||
            post.category.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, posts]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-blog-list', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.ok && data?.rows) {
        setPosts(data.rows);
      } else {
        throw new Error(data?.error || 'Failed to load blog posts');
      }
    } catch (error) {
      console.error('[AdminBlogList] Load error:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete blog post "${title}"? This cannot be undone.`)) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-blog-delete', {
        body: { id },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('[AdminBlogList] Delete error:', error);
        throw new Error('Failed to connect to server');
      }

      if (data?.ok) {
        toast.success('Blog post deleted successfully');
        
        // Trigger cache bust and sitemap rebuild
        try {
          await supabase.functions.invoke('admin-cache-bust', {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
            },
          });
          
          await supabase.functions.invoke('admin-sitemap-rebuild', {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
            },
          });
        } catch (cacheError) {
          console.error('[AdminBlogList] Cache/sitemap error:', cacheError);
        }
        
        await loadPosts();
      } else {
        throw new Error(data?.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('[AdminBlogList] Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete blog post');
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingId(undefined);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingId(undefined);
  };

  const handleEditorSave = async () => {
    setEditorOpen(false);
    setEditingId(undefined);
    await loadPosts();
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Blog Posts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your blog content
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {search ? 'No posts found matching your search' : 'No blog posts yet'}
            </p>
            {!search && (
              <Button onClick={handleCreate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.category}</TableCell>
                    <TableCell>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(post.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(post.id, post.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <BlogEditor
            blogId={editingId}
            onClose={handleEditorClose}
            onSave={handleEditorSave}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
