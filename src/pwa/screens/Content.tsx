import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SmartLink from '@/components/SmartLink';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { GraduationCap, Play, Clock, CheckCircle, Lock } from 'lucide-react';
import { usePWA } from '../core/PWAProvider';

interface Lesson {
  slug: string;
  title_en: string;
  summary_en: string;
  duration_sec: number;
  poster_url: string;
  tags: string[];
  progress?: number;
  completed?: boolean;
}

export default function Content() {
  const { isOnline, isGuest } = usePWA();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOnline) {
      fetchLessons();
    }
  }, [isOnline]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('slug, title_en, summary_en, duration_sec, poster_url, tags, published')
        .eq('published', true)
        .order('order_index')
        .limit(20);

      if (!error && data) {
        setLessons(data);
      }
    } catch (err) {
      console.error('[Content] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          Learn & Grow
        </h1>
        <p className="text-muted-foreground">
          Curated lessons for your personal and professional development
        </p>
      </div>

      {/* Lessons Grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.slug} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <SmartLink to={`/pwa/content/${lesson.slug}`} className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-40 h-32 flex-shrink-0 bg-muted">
                  {lesson.poster_url ? (
                    <img
                      src={lesson.poster_url}
                      alt={lesson.title_en}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {lesson.title_en}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lesson.summary_en}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    {lesson.duration_sec && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(lesson.duration_sec)}
                      </div>
                    )}
                    {lesson.tags && lesson.tags.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {lesson.tags[0]}
                      </Badge>
                    )}
                    {lesson.completed && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </SmartLink>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && lessons.length === 0 && (
        <Card className="p-12 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No lessons available</h3>
          <p className="text-muted-foreground">
            {isOnline ? 'Check back soon for new content' : 'You\'re offline'}
          </p>
        </Card>
      )}

      {/* Premium CTA for Guests */}
      {isGuest && lessons.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <h3 className="font-semibold mb-2">Unlock Premium Content</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to track your progress, bookmark lessons, and access exclusive content
          </p>
          <Button asChild>
            <SmartLink to="/auth">
              Sign In
            </SmartLink>
          </Button>
        </Card>
      )}
    </div>
  );
}
