import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}

interface BlogSheetProps {
  open: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

export function BlogSheet({ open, onClose, post }: BlogSheetProps) {
  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface max-w-md mx-auto max-h-[60vh] flex flex-col animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full bg-border mx-auto mt-3 mb-2" />
        
        <div className="flex items-start justify-between px-6 py-3 border-b border-border">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-fg leading-tight">{post.title}</h3>
            <p className="text-xs text-muted mt-1">{post.date} · {post.readTime}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg ml-2">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm text-muted leading-relaxed">{post.excerpt}</p>
        </div>

        <div className="border-t border-border p-4 bg-surface">
          <Link to={`/blog/${post.slug}`}>
            <Button className="w-full h-11 bg-brand text-white hover:bg-brand/90 rounded-xl">
              Read full article
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
