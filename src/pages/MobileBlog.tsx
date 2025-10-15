import { useState, useEffect } from 'react';
import { track } from '@/analytics/events';
import { Link } from 'react-router-dom';
import { BlogSheet } from '@/components/BlogSheet';
import { supabase } from '@/integrations/supabase/client';

export default function MobileBlog() {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    track('page_view', { page: 'mobile_blog' });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(6);
    
    if (data) setPosts(data);
  };

  return (
    <>
      <div className="min-h-screen bg-bg pb-20">
        <header className="p-6 pt-8 border-b border-border">
          <h1 className="text-2xl font-serif font-bold text-fg">Resources</h1>
          <p className="text-sm text-muted mt-1">Insights for your growth journey</p>
        </header>

        <div className="p-4 space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="w-full p-4 rounded-2xl border border-border bg-surface hover:shadow-md transition-all text-left"
            >
              <h3 className="font-semibold text-fg mb-2 line-clamp-2">{post.title}</h3>
              <p className="text-sm text-muted mb-3 line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{post.read_time} min read</span>
              </div>
            </button>
          ))}

          <Link 
            to="/blog"
            className="block w-full h-12 rounded-xl border-2 border-brand text-brand hover:bg-brand/5 transition-all flex items-center justify-center font-medium mt-4"
          >
            See all articles
          </Link>
        </div>
      </div>

      <BlogSheet 
        open={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost} 
      />
    </>
  );
}
