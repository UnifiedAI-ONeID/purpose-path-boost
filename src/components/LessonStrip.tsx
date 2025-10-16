import { useEffect, useState } from 'react';
import SmartLink from './SmartLink';
import { LessonPlayerYT } from './LessonPlayerYT';
import { invokeApi } from '@/lib/api-client';

interface Lesson {
  slug: string;
  title_en: string;
  summary_en: string;
  poster_url?: string;
  yt_id?: string;
  duration_sec?: number;
  progress?: {
    completed: boolean;
    last_position_sec: number;
    watched_seconds: number;
  } | null;
}

interface LessonStripProps {
  profileId: string;
  tags?: string[];
}

export function LessonStrip({ profileId, tags = [] }: LessonStripProps) {
  const [rows, setRows] = useState<Lesson[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const tagsParam = tags.join(',');
      
      try {
        const response = await invokeApi('/api/lessons/for-user', {
          body: { profile_id: profileId, tags: tagsParam }
        });
        if (response.ok) {
          setRows(response.rows || []);
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [profileId, tags.join(',')]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground">Loading lessons...</div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground">No lessons available yet.</div>
      </div>
    );
  }

  const next = rows.find(r => !r.progress?.completed) || rows[0];
  const rest = rows.filter(r => r.slug !== next.slug).slice(0, 6);

  return (
    <div className="grid gap-4">
      {/* Next up - Featured lesson */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground mb-3">Next up</div>
        <div className="flex flex-col md:flex-row gap-4">
          <LessonPoster item={next} onPlay={() => setOpen(next.slug)} />
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{next.title_en}</h3>
            <p className="text-muted-foreground mb-4">{next.summary_en}</p>
            <div className="flex flex-wrap gap-2">
              <button 
                className="btn btn-cta" 
                onClick={() => setOpen(next.slug)}
              >
                {next.progress?.last_position_sec ? 'Continue watching' : 'Watch now'}
              </button>
              <SmartLink to="/coaching">
                <button className="btn">Book a session</button>
              </SmartLink>
            </div>
          </div>
        </div>
      </div>

      {/* Quick library grid */}
      {rest.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {rest.map((r) => (
            <LessonPoster 
              key={r.slug} 
              item={r} 
              onPlay={() => setOpen(r.slug)} 
              small 
            />
          ))}
        </div>
      )}

      {/* Player modal */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4" 
          onClick={() => setOpen(null)}
        >
          <div 
            className="bg-card border border-border rounded-2xl w-full max-w-4xl overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <LessonPlayerYT 
              profileId={profileId} 
              slug={open} 
              onClose={() => setOpen(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface LessonPosterProps {
  item: Lesson;
  onPlay: () => void;
  small?: boolean;
}

function LessonPoster({ item, onPlay, small = false }: LessonPosterProps) {
  const poster = item.poster_url || (item.yt_id ? `https://i.ytimg.com/vi/${item.yt_id}/hqdefault.jpg` : '');
  const progress = item.progress;
  const pct = progress?.completed 
    ? 100 
    : Math.min(100, Math.round(100 * (progress?.last_position_sec || 0) / Math.max(1, item.duration_sec || 1)));

  return (
    <button 
      className={`relative overflow-hidden rounded-xl border border-border ${small ? 'h-40' : 'h-64'} w-full group transition-transform hover:scale-[1.02]`}
      onClick={onPlay}
    >
      {poster && (
        <img 
          src={poster} 
          alt={item.title_en} 
          className="absolute inset-0 w-full h-full object-cover" 
          loading="lazy" 
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className={`font-medium ${small ? 'text-sm' : 'text-base'} line-clamp-2 mb-2`}>
          {item.title_en}
        </div>
        
        {/* Progress bar */}
        {pct > 0 && (
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-accent transition-all" 
              style={{ width: `${pct}%` }} 
            />
          </div>
        )}
      </div>
      
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="h-14 w-14 rounded-full bg-white/90 text-foreground flex items-center justify-center shadow-lg group-hover:bg-white transition-colors">
          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </button>
  );
}
