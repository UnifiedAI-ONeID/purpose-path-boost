import { useState, useEffect } from 'react';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string | null;
  created_at: string;
  read_time: number;
}

const BlogList = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, category, published_at, created_at, read_time')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      setBlogPosts(data || []);
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set((data || []).map(post => post.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      toast.error('Failed to load blog posts. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = selectedCategory === 'All'
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);
  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground">
            Insights and strategies for professional growth
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(category);
                trackEvent('blog_category_click', { category });
              }}
            >
              <Tag className="h-4 w-4 mr-2" />
              {category}
            </Button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No blog posts found. Check back soon!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {filteredPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-medium transition-smooth">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="px-2 py-1 rounded-full bg-brand-accent/10 text-brand-accent font-medium">
                      {post.category}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <h2 className="text-2xl font-serif font-bold mb-2">{post.title}</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{post.read_time} min read</span>
                    <Button
                      asChild
                      variant="link"
                      className="p-0"
                      onClick={() => trackEvent('blog_read', { slug: post.slug })}
                    >
                      <SmartLink to={`${ROUTES.blogDetail.replace('[slug]', post.slug)}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </SmartLink>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-primary text-white rounded-2xl p-12 text-center">
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
            onClick={() => trackEvent('cta_click', { button: 'Blog CTA Book Session', location: 'blog_footer' })}
          >
            <SmartLink to={ROUTES.coaching}>Book a Free Session</SmartLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogList;
