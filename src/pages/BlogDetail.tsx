import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { sanitizeHtml } from '@/lib/sanitize';
import { useIsMobile } from '@/hooks/use-mobile';
import BlogDetailMobile from '@/components/mobile/BlogDetailMobile';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image_url?: string;
  published: boolean;
  created_at: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  read_time: number;
}

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use mobile version on mobile devices
  if (isMobile) {
    return <BlogDetailMobile />;
  }

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        toast.error('Blog post not found');
        setPost(null);
        return;
      }

      setPost(data);
      
      // Track blog read
      trackEvent('blog_read', { slug: data.slug, category: data.category });
    } catch (error) {
      console.error('Failed to load blog post:', error);
      toast.error('Failed to load blog post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <SmartLink to={ROUTES.blog}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </SmartLink>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <article className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8">
            <SmartLink to={ROUTES.blog}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </SmartLink>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent font-medium flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {post.category}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.read_time} min read
              </div>
            </div>

            <h1 className="text-5xl font-serif font-bold mb-4">{post.title}</h1>
            
            <p className="text-xl text-muted-foreground mb-6">
              {post.excerpt}
            </p>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">By {post.author}</span>
            </div>
          </div>

          {/* Featured Image */}
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-2xl mb-12 aspect-video object-cover"
            />
          )}

          {/* Content */}
          <div 
            className="article-content prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* CTA */}
          <div className="mt-16 bg-gradient-primary text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-serif font-bold mb-4">
              Ready to Transform Your Career?
            </h2>
          <p className="text-xl mb-8 text-white/90">
            Get personalized guidance to achieve your goals
          </p>
          <Button 
            asChild 
            variant="hero" 
            size="lg"
            onClick={() => trackEvent('cta_click', { button: 'Blog Detail CTA Book Session', location: 'blog_detail_footer' })}
          >
            <SmartLink to={ROUTES.coaching}>Book a Free Session</SmartLink>
          </Button>
          </div>
        </motion.div>
      </article>
    </div>
  );
};

export default BlogDetail;