import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { invokeApi } from '@/lib/api-client';
import { FunnelUpsellDialog } from './FunnelUpsellDialog';

interface Lesson {
  slug: string;
  title_en: string;
  summary_en: string;
  yt_id?: string;
  duration_sec?: number;
  poster_url?: string;
  cn_alt_url?: string;
  captions_vtt_url?: string;
}

interface LessonPlayerLiteProps {
  profileId: string;
  slug: string;
  onClose: () => void;
}

function detectCN(): boolean {
  try {
    const lang = (navigator.language || '').toLowerCase();
    return /zh-cn|zh-hans|cn|zh/.test(lang) && !/tw|hk/.test(lang);
  } catch {
    return false;
  }
}

export function LessonPlayerLite({ profileId, slug, onClose }: LessonPlayerLiteProps) {
  const [data, setData] = useState<Lesson | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [milestones, setMilestones] = useState<{ [key: string]: boolean }>({});
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);
  const isCN = detectCN();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await invokeApi('/api/lessons/get', {
          body: { slug }
        });
        if (response.ok && response.lesson) {
          setData(response.lesson);
        }
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
      }
    })();
  }, [slug]);

  // Time tracking
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(t => t + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Milestone tracking
  useEffect(() => {
    if (!data?.duration_sec) return;

    const pct = currentTime / data.duration_sec;
    const marks: [number, string][] = [
      [0.25, '25%'],
      [0.5, '50%'],
      [0.75, '75%'],
    ];

    marks.forEach(([threshold, label]) => {
      if (pct >= threshold && !milestones[label]) {
        setMilestones(m => ({ ...m, [label]: true }));
        supabase.functions.invoke('api-lessons-event', {
          body: {
            profile_id: profileId,
            lesson_slug: slug,
            ev: label,
            at_sec: currentTime,
          }
        }).catch(console.error);
      }
    });
  }, [currentTime, data?.duration_sec, milestones, profileId, slug]);

  const markComplete = async () => {
    await supabase.functions.invoke('api-lessons-progress', {
      body: {
        profile_id: profileId,
        lesson_slug: slug,
        last_position_sec: currentTime,
        watched_seconds: data?.duration_sec || 0,
        completed: true,
      }
    });

    await supabase.functions.invoke('api-lessons-event', {
      body: {
        profile_id: profileId,
        lesson_slug: slug,
        ev: 'cta_book',
        at_sec: currentTime,
      }
    });

    // Show funnel upsell dialog after completion
    setShowFunnelDialog(true);
  };

  const saveProgress = async () => {
    await supabase.functions.invoke('api-lessons-progress', {
      body: {
        profile_id: profileId,
        lesson_slug: slug,
        last_position_sec: currentTime,
        watched_seconds: data?.duration_sec || 0,
      }
    }).catch(console.error);
  };

  if (!data) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  const ytSrc = `https://www.youtube-nocookie.com/embed/${data.yt_id}?modestbranding=1&rel=0&playsinline=1&autoplay=1`;
  const cnSrc = data.cn_alt_url || '';

  return (
    <div>
      {/* Funnel upsell dialog */}
      <FunnelUpsellDialog
        lessonSlug={slug}
        open={showFunnelDialog}
        onOpenChange={setShowFunnelDialog}
      />

      {/* Video container */}
      <div className="relative aspect-video w-full bg-black">
        {!isCN && data.yt_id ? (
          <iframe
            src={ytSrc}
            title={data.title_en}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        ) : cnSrc ? (
          <video
            controls
            playsInline
            autoPlay
            className="w-full h-full"
            poster={data.poster_url || (data.yt_id ? `https://i.ytimg.com/vi/${data.yt_id}/hqdefault.jpg` : '')}
          >
            <source src={cnSrc} type="video/mp4" />
            {data.captions_vtt_url && (
              <track src={data.captions_vtt_url} kind="subtitles" srcLang="zh" label="中文" default />
            )}
          </video>
        ) : (
          <div className="flex items-center justify-center h-full text-white/80 p-6 text-center">
            <div>No video source available in your region.</div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Info and actions */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{data.title_en}</h2>
        <p className="text-muted-foreground mb-6">{data.summary_en}</p>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              await markComplete();
              window.location.href = '/coaching';
            }}
          >
            Book a session
          </Button>
          
          <Button
            variant="outline"
            onClick={async () => {
              await saveProgress();
              onClose();
            }}
          >
            Save progress & close
          </Button>
          
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
