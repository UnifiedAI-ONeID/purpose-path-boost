
import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/trackEvent';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { BlogSheet } from '@/components/BlogSheet';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  published_at: string;
  read_time: number;
  category: string;
}

export default function MobileBlog() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trackEvent('page_view', { page: 'mobile_blog' });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'blog_posts'),
        where('published', '==', true),
        orderBy('published_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          published_at: d.published_at?.seconds ? new Date(d.published_at.seconds * 1000).toISOString() : d.published_at
        };
      }) as BlogPost[];
      setPosts(data);
    } catch (error) {
      console.error("Failed to load posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-bg pb-20">
        <header className="p-6 pt-8 border-b border-border">
          <h1 className="text-2xl font-serif font-bold text-fg">Resources</h1>
          <p className="text-sm text-muted mt-1">Insights for your growth journey</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted">No articles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="w-full p-4 rounded-2xl border border-border bg-surface hover:shadow-md transition-all text-left animate-fade-in"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="font-semibold text-fg mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-muted mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.read_time} min read</span>
                </div>
              </button>
            ))}

            <SmartLink 
              to={ROUTES.blog}
              className="block w-full h-12 rounded-xl border-2 border-brand text-brand hover:bg-brand/5 transition-all flex items-center justify-center font-medium mt-6"
            >
              See all articles
            </SmartLink>
          </div>
        )}
      </div>

      <BlogSheet 
        open={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost} 
      />
    </>
  );
}
