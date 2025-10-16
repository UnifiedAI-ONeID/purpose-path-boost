import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileShell from "./MobileShell";
import { Helmet } from "react-helmet-async";
import { Share2, Copy, MessageCircle } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url?: string;
  category: string;
  author: string;
  read_time: number;
  published_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
};

export default function BlogDetailMobile() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
  const [reading, setReading] = useState(0);
  const [related, setRelated] = useState<Post[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPost();
  }, [slug]);

  useEffect(() => {
    function onScroll() {
      if (!articleRef.current) return;
      const el = articleRef.current;
      const max = el.scrollHeight - window.innerHeight;
      setReading(Math.max(0, Math.min(1, window.scrollY / Math.max(1, max))));
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function loadPost() {
    if (!slug) return;

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;
      
      setPost(data);

      // Build TOC from content
      const div = document.createElement('div');
      div.innerHTML = data.content;
      const headings = [...div.querySelectorAll('h2, h3')].slice(0, 12);
      setToc(headings.map((n, i) => ({ 
        id: `h-${i}`, 
        text: n.textContent || '' 
      })));

      // Load related posts
      const { data: relatedData } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('category', data.category)
        .neq('slug', slug)
        .limit(3);
      
      if (relatedData) setRelated(relatedData);
    } catch (err) {
      console.error('Failed to load post:', err);
    }
  }

  function tagHeadings(html: string) {
    let i = 0;
    return html.replace(/<(h[2-3])>([^<]+)<\/h[2-3]>/g, (m, tag, text) => {
      const id = `h-${i++}`;
      return `<${tag} id="${id}">${text}</${tag}>`;
    });
  }

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  }

  function shareWeChat() {
    const url = window.location.href;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    const w = window.open('', '_blank', 'width=250,height=300');
    if (w) {
      w.document.write(`
        <html>
          <head><title>WeChat Share</title></head>
          <body style="margin:0;padding:20px;text-align:center;font-family:sans-serif;">
            <h3 style="margin-bottom:10px;">Scan to Share</h3>
            <img src="${qrUrl}" style="width:200px;height:200px;"/>
            <p style="font-size:12px;color:#666;margin-top:10px;">Scan with WeChat</p>
          </body>
        </html>
      `);
    }
  }

  if (!post) {
    return (
      <MobileShell>
        <main className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-2xl"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Helmet>
        <title>{post.meta_title || `${post.title} | ZhenGrowth Blog`}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:author" content={post.author} />
      </Helmet>

      {/* Reading Progress Bar */}
      <div className="fixed top-[56px] left-0 right-0 h-1 bg-muted/50 z-40">
        <div 
          className="h-1 bg-primary transition-all duration-100" 
          style={{ width: `${reading * 100}%` }} 
        />
      </div>

      {/* Article Content */}
      <article className="px-4 pt-4 pb-24" ref={articleRef}>
        {/* Cover Image */}
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt={post.title}
            width={1080} 
            height={608} 
            className="w-full h-auto rounded-2xl mb-4"
            loading="lazy" 
            decoding="async"
          />
        )}

        {/* Title & Meta */}
        <h1 className="text-2xl leading-tight font-bold mb-2">{post.title}</h1>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>{new Date(post.published_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{post.read_time} min read</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
            {post.category}
          </span>
        </div>

        {/* Share Actions */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <button 
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-accent transition text-sm"
            onClick={copyLink}
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-accent transition text-sm"
            onClick={shareWeChat}
          >
            <MessageCircle className="w-4 h-4" />
            WeChat
          </button>
          {navigator.share && (
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-accent transition text-sm"
              onClick={() => navigator.share({ title: post.title, url: window.location.href })}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
        </div>

        {/* Table of Contents */}
        {toc.length > 1 && (
          <details className="mb-6 rounded-xl border border-border bg-muted/50 p-4">
            <summary className="font-medium cursor-pointer">On This Page</summary>
            <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-primary hover:underline">
                    {t.text}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* Article Body */}
        <div 
          className="prose prose-sm max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: tagHeadings(post.content) }} 
        />

        {/* CTA Buttons */}
        <div className="grid gap-3 mb-8">
          <a 
            href="/book" 
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition inline-flex items-center justify-center"
          >
            Book a Free Discovery Call
          </a>
          <a 
            href="/quiz" 
            className="w-full h-12 rounded-xl border border-border bg-background hover:bg-accent transition inline-flex items-center justify-center font-medium"
          >
            Take the 3-min Clarity Quiz
          </a>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
            <div className="grid gap-3">
              {related.map((p) => (
                <a 
                  key={p.slug} 
                  href={`/blog/${p.slug}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:shadow-md transition"
                >
                  <div className="font-medium mb-1">{p.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {p.excerpt}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </MobileShell>
  );
}