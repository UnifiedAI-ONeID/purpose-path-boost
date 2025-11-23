
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Play } from 'lucide-react';
import { functions } from '@/firebase/config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

const getContinueWatching = httpsCallable(functions, 'api-lessons-continue');

interface ContinueWatchingItem {
  slug: string;
  title_en: string;
  poster_url?: string;
  yt_id?: string;
  cn_alt_url?: string;
  duration_sec?: number;
  last_position_sec?: number;
}

interface ContinueWatchingResult {
    ok: boolean;
    item: ContinueWatchingItem | null;
}

interface ContinueWatchingBarProps {
  profileId: string;
  onOpenLesson: (slug: string) => void;
}

export function ContinueWatchingBar({ profileId, onOpenLesson }: ContinueWatchingBarProps) {
  const [item, setItem] = useState<ContinueWatchingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        // Call Firebase Function
        const result: HttpsCallableResult<unknown> = await getContinueWatching({ profile_id: profileId });
        const data = result.data as ContinueWatchingResult;
        
        if (data.ok) {
          setItem(data.item || null);
        }
      } catch (error) {
        console.error('Failed to fetch continue watching:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [profileId]);

  if (isLoading || !item) return null;

  const progressPercent = item.duration_sec
    ? Math.min(100, Math.round((100 * (item.last_position_sec || 0)) / item.duration_sec))
    : 0;

  const poster =
    item.poster_url ||
    (item.yt_id ? `https://i.ytimg.com/vi/${item.yt_id}/hqdefault.jpg` : '/icon-512.png');

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-brand-accent/50 transition-colors">
      <div className="relative">
        <img
          src={poster}
          alt=""
          className="h-16 w-28 rounded-lg object-cover border border-border"
          loading="lazy"
        />
        {progressPercent > 0 && (
          <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-accent"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">Continue watching</div>
        <div className="font-medium truncate">{item.title_en}</div>
        {progressPercent > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {progressPercent}% complete
          </div>
        )}
      </div>

      <Button onClick={() => onOpenLesson(item.slug)} className="shrink-0">
        <Play className="h-4 w-4 mr-2" />
        Resume
      </Button>
    </div>
  );
}
