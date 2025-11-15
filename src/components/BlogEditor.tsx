import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { sanitizeHtml, calculateReadTime } from '@/lib/sanitize';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { X, Save, Send, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  excerpt: z.string().min(20).max(500),
  content: z.string().min(100),
  category: z.string().min(2),
  author: z.string().min(2),
  image_url: z.string().url().optional().or(z.literal('')),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  read_time: z.number().min(1).max(60),
  published: z.boolean(),
});

type BlogFormData = z.infer<typeof blogSchema>;

interface BlogEditorProps {
  blogId?: string;
  onClose: () => void;
  onSave: () => void;
}

const socialPlatforms = [
  { id: 'twitter', name: 'Twitter/X', enabled: true },
  { id: 'linkedin', name: 'LinkedIn', enabled: true },
  { id: 'facebook', name: 'Facebook', enabled: false },
];

export const BlogEditor = ({ blogId, onClose, onSave }: BlogEditorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'linkedin']);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      author: 'Grace Huang',
      read_time: 5,
      published: false,
    },
  });

  const published = watch('published');
  const title = watch('title');
  const content = watch('content');

  // Generate slug from title
  useEffect(() => {
    if (title && !blogId) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 200);
      setValue('slug', slug);
    }
  }, [title, blogId, setValue]);

  // Auto-calculate read time
  useEffect(() => {
    if (content) {
      const readTime = calculateReadTime(content);
      setValue('read_time', readTime);
    }
  }, [content, setValue]);

  // Load existing blog if editing
  useEffect(() => {
    if (blogId) {
      loadBlog();
    }
  }, [blogId]);

  const loadBlog = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', blogId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        reset({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          author: data.author,
          image_url: data.image_url || '',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          read_time: data.read_time,
          published: data.published,
        });
      }
    } catch (error) {
      console.error('Failed to load blog post');
      toast.error('Failed to load blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const blogData: any = {
        ...data,
        content: sanitizeHtml(data.content),
        image_url: data.image_url || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
      };

      if (blogId) {
        blogData.id = blogId;
      }

      const { data: result, error } = await supabase.functions.invoke('admin-blog-upsert', {
        body: blogData,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('[BlogEditor] Save error:', error);
        throw new Error('Failed to connect to server');
      }
      
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to save blog post');
      }

      toast.success(blogId ? 'Blog post updated successfully' : 'Blog post created successfully');

      // Handle social posting for new published posts
      if (!blogId && data.published && selectedPlatforms.length > 0) {
        try {
          const { data: newBlog } = await supabase
            .from('blog_posts')
            .select('id, slug')
            .eq('slug', data.slug)
            .maybeSingle();
          
          if (newBlog) {
            await publishToSocial(newBlog.id, data.title, data.excerpt, newBlog.slug);
          }
        } catch (socialError) {
          console.error('[BlogEditor] Social posting error:', socialError);
          toast.error('Blog saved but social posting failed');
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('[BlogEditor] Save error:', error);
      toast.error(error.message || 'Failed to save blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const publishToSocial = async (blogId: string, title: string, excerpt: string, slug: string) => {
    setIsPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-to-social', {
        body: {
          blogId,
          title,
          excerpt,
          slug,
          platforms: selectedPlatforms,
        },
      });

      if (error) {
        console.error('[BlogEditor] Social posting API error:', error);
        throw error;
      }

      toast.success('Post scheduled for social media');
    } catch (error: any) {
      console.error('[BlogEditor] Social posting failed:', error);
      throw new Error(error.message || 'Social media posting failed');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold">
          {blogId ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" {...register('slug')} placeholder="my-blog-post" />
            {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea id="excerpt" {...register('excerpt')} rows={3} />
            {errors.excerpt && <p className="text-sm text-destructive mt-1">{errors.excerpt.message}</p>}
          </div>

          <div>
            <Label htmlFor="content">Content *</Label>
            <RichTextEditor
              content={content || ''}
              onChange={(value) => setValue('content', value)}
              placeholder="Write your blog post content here..."
            />
            {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input id="category" {...register('category')} placeholder="Growth" />
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <Label htmlFor="author">Author *</Label>
              <Input id="author" {...register('author')} />
              {errors.author && <p className="text-sm text-destructive mt-1">{errors.author.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Featured Image URL</Label>
            <Input id="image_url" {...register('image_url')} placeholder="https://..." />
            {errors.image_url && <p className="text-sm text-destructive mt-1">{errors.image_url.message}</p>}
          </div>

          <div>
            <Label htmlFor="read_time">Read Time (minutes) *</Label>
            <Input
              id="read_time"
              type="number"
              {...register('read_time', { valueAsNumber: true })}
            />
            {errors.read_time && <p className="text-sm text-destructive mt-1">{errors.read_time.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>Optimize for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meta_title">Meta Title (60 chars max)</Label>
            <Input id="meta_title" {...register('meta_title')} />
            {errors.meta_title && <p className="text-sm text-destructive mt-1">{errors.meta_title.message}</p>}
          </div>

          <div>
            <Label htmlFor="meta_description">Meta Description (160 chars max)</Label>
            <Textarea id="meta_description" {...register('meta_description')} rows={2} />
            {errors.meta_description && <p className="text-sm text-destructive mt-1">{errors.meta_description.message}</p>}
          </div>
        </CardContent>
      </Card>

      {!blogId && (
        <Card>
          <CardHeader>
            <CardTitle>Social Media Cross-Posting</CardTitle>
            <CardDescription>Automatically share when published</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.id}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlatforms([...selectedPlatforms, platform.id]);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                    }
                  }}
                  disabled={!platform.enabled}
                />
                <Label htmlFor={platform.id} className="font-normal">
                  {platform.name}
                  {!platform.enabled && <span className="text-muted-foreground ml-2">(Coming soon)</span>}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={(checked) => setValue('published', checked)}
            />
            <Label htmlFor="published" className="font-normal">
              Publish immediately
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isPublishing}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isPublishing ? (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publishing...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {blogId ? 'Update' : 'Create'} Post
            </>
          )}
        </Button>
      </div>
    </form>
  );
};