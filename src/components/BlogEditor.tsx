import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, db } from '@/firebase/config';
import { collection, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { sanitizeHtml, calculateReadTime } from '@/lib/sanitize';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { X, Save, Send, Loader2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { invokeApi } from '@/lib/api-client';

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

interface BlogData extends BlogFormData {
    id?: string;
    updated_at: string | Date;
    published_at?: string | Date;
    created_at?: string | Date;
}

interface BlogEditorProps {
  blogId?: string;
  onClose: () => void;
  onSave: () => void;
}

interface SocialPost {
  platform: string;
  content: string;
}

const socialPlatforms = [
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'linkedin', name: 'LinkedIn' },
];

export const BlogEditor = ({ blogId, onClose, onSave }: BlogEditorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState(socialPlatforms[0].id);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, getValues } = useForm<BlogFormData>({
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

  useEffect(() => {
    if (content) {
      const readTime = calculateReadTime(content);
      setValue('read_time', readTime);
    }
  }, [content, setValue]);

  const loadBlog = useCallback(async () => {
    setIsLoading(true);
    try {
        if (!blogId) return;
        const docRef = doc(db, 'blog_posts', blogId);
        const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as BlogData;
        reset(data);
      }
    } catch (error: unknown) {
      console.error('Failed to load blog post', error);
      toast.error('Failed to load blog post');
    } finally {
      setIsLoading(false);
    }
  }, [blogId, reset]);

  useEffect(() => {
    if (blogId) {
      loadBlog();
    }
  }, [blogId, loadBlog]);

  const generatePreviews = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Authentication required');
      return;
    }

    setGeneratingPreview(true);
    const { title, excerpt, slug } = getValues();
    try {
      const res = await invokeApi<{ previews: SocialPost[] }>('/api/social/preview', {
        method: 'POST',
        body: { title: sanitizeHtml(title), excerpt: sanitizeHtml(excerpt), slug: sanitizeHtml(slug), platforms: socialPlatforms.map(p => p.id) }
      });

      if (res.ok && res.previews) {
        setSocialPosts(res.previews);
      } else {
        toast.error(res.error || 'Failed to generate previews');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleContentChange = (platform: string, content: string) => {
    setSocialPosts(socialPosts.map(p => p.platform === platform ? { ...p, content } : p));
  };

  const onSubmit = async (data: BlogFormData, publish: boolean = false) => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Authentication required');
        return;
      }

      const blogData = {
        ...data,
        content: sanitizeHtml(data.content),
        updated_at: serverTimestamp(),
      };

      let savedBlogId = blogId;

      if (blogId) {
        const docRef = doc(db, 'blog_posts', blogId);
        await updateDoc(docRef, blogData);
        toast.success('Blog post updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'blog_posts'), {
          ...blogData,
          created_at: serverTimestamp(),
        });
        savedBlogId = docRef.id;
        toast.success('Blog post created successfully');
      }

      if (publish && savedBlogId) {
        await publishToSocial(savedBlogId);
      }

      onSave();
      onClose();
    } catch (error: unknown) {
      console.error('[BlogEditor] Save error:', error);
      toast.error('Failed to save blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const publishToSocial = async (blogId: string) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Authentication required');
      return;
    }

    setIsPublishing(true);
    try {
      await invokeApi('/api/social/post', {
        method: 'POST',
        body: { blogId, posts: socialPosts.map(p => ({...p, content: sanitizeHtml(p.content)})) }
      });
      toast.success('Posts sent for publishing!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to publish');
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
    <form className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold">
          {blogId ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="content">Body *</Label>
                <RichTextEditor
                  content={content || ''}
                  onChange={(value) => setValue('content', value)}
                  placeholder="Write your blog post content here..."
                />
                {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Social Media Posts</CardTitle>
                <CardDescription>Customize content for each platform.</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={generatePreviews} disabled={generatingPreview || socialPosts.length > 0}>
                <Sparkles className="w-4 h-4 mr-2" />
                {generatingPreview ? 'Generating...' : socialPosts.length > 0 ? 'Previews Generated' : 'Generate Previews'}
              </Button>
            </CardHeader>
            {socialPosts.length > 0 && (
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    {socialPosts.map(p => <TabsTrigger key={p.platform} value={p.platform}>{socialPlatforms.find(sp => sp.id === p.platform)?.name}</TabsTrigger>)}
                  </TabsList>
                  {socialPosts.map(p => (
                    <TabsContent key={p.platform} value={p.platform}>
                      <Textarea
                        value={p.content}
                        onChange={(e) => handleContentChange(p.platform, e.target.value)}
                        rows={8}
                        className="w-full h-auto mt-2"
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input id="slug" {...register('slug')} placeholder="my-blog-post" />
                {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea id="excerpt" {...register('excerpt')} rows={4} />
                {errors.excerpt && <p className="text-sm text-destructive mt-1">{errors.excerpt.message}</p>}
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
                <Input id="image_url" {...register('image_url')} placeholder="https://" />
                {errors.image_url && <p className="text-sm text-destructive mt-1">{errors.image_url.message}</p>}
              </div>
              <div>
                <Label htmlFor="read_time">Read Time (minutes) *</Label>
                <Input id="read_time" type="number" {...register('read_time', { valueAsNumber: true })} />
                {errors.read_time && <p className="text-sm text-destructive mt-1">{errors.read_time.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input id="meta_title" {...register('meta_title')} />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea id="meta_description" {...register('meta_description')} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch id="published" checked={published} onCheckedChange={(checked) => setValue('published', checked)} />
                <Label htmlFor="published" className="font-normal">Publish on blog</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="button" onClick={handleSubmit(data => onSubmit(data, true))} disabled={isLoading || isPublishing || socialPosts.length === 0}>
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
              Save & Publish
            </Button>
            <Button type="button" variant="secondary" onClick={handleSubmit(data => onSubmit(data, false))} disabled={isLoading || isPublishing}>
              <Save className="mr-2 h-4 w-4" /> 
              Save as Draft
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </form>
  );
};
