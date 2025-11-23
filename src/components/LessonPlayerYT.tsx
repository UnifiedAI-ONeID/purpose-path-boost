f
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { loadYouTubeAPI } from '@/lib/youtubeApi';
import UpsellModal from './UpsellModal';
import { FunnelUpsellDialog } from './FunnelUpsellDialog';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// Function definitions
const paywallCanWatch = httpsCallable(functions, 'api-paywall-can-watch');
const paywallMarkWatch = httpsCallable(functions, 'api-paywall-mark-watch');
const getLesson = httpsCallable(functions, 'api-lessons-get'); // Assuming there's a function for this
const saveProgressFn = httpsCallable(functions, 'api-lessons-progress');
const logEventFn = httpsCallable(functions, 'api-lessons-event');

interface Lesson {
  slug: string;
  title_en: string;
  summary_en?: string;
  yt_id?: string;
  duration_sec?: number;
  poster_url?: string;
  cn_alt_url?: string;
  captions_vtt_url?: string;
  chapters?: { t: number; label: string }[];
}

interface LessonPlayerYTProps {
  profileId: string;
  slug: string;
  onClose: () => void;
}

function detectCN(): boolean {
  try {
    const lang = (navigator.language || '').toLowerCase();
    return /zh-cn|zh-hans/.test(lang) && !/tw|hk/.test(lang);
  } catch {
    return false;
  }
}

export function LessonPlayerYT({ profileId, slug, onClose }: LessonPlayerYTProps) {
  const ytRef = useRef<HTMLDivElement | null>(null);
  const ytPlayer = useRef<any>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);

  const [data, setData] = useState<{ lesson: Lesson; progress?: any } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [milestones, setMilestones] = useState<{ [key: string]: boolean }>({});
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellPlan, setUpsellPlan] = useState('starter');
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const isCN = detectCN();

  // Fetch lesson data with paywall check
  useEffect(() => {
    (async () => {
      try {
        const gateResult: any = await paywallCanWatch({
          profile_id: profileId, 
          lesson_slug: slug 
        });
        const gateCheck = gateResult.data;

        if (!gateCheck?.access) {
          setShowUpsell(true);
          setUpsellPlan(gateCheck?.upsell?.recommended || 'starter');
          return;
        }

        setHasAccess(true);
        paywallMarkWatch({
          profile_id: profileId, 
          lesson_slug: slug 
        }).catch(console.error);

        if (gateCheck.plan_slug === 'free' && gateCheck.remaining === 1) {
          toast('Unlock your next 30 days', {
            action: { label: 'See plans', onClick: () => window.location.href = '/pricing?highlight=starter' }
          });
        }

        const lessonResult: any = await getLesson({
          slug, 
          profile_id: profileId 
        });
        const response = lessonResult.data;
        
        if (response.ok) {
          setData({ lesson: response.lesson, progress: response.progress });
          setDuration(response.lesson?.duration_sec || 0);
        }
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
      }
    })();
  }, [slug, profileId]);

  // Initialize YouTube player
  useEffect(() => {
    if (!data?.lesson) return;
    if (isCN || !data.lesson.yt_id) return;

    (async () => {
      try {
        await loadYouTubeAPI();
        if (!ytRef.current) return;

        const startTime = Math.max(0, Number(data.progress?.last_position_sec || 0));

        ytPlayer.current = new (window as any).YT.Player(ytRef.current, {
          width: '100%',
          height: '100%',
          videoId: data.lesson.yt_id,
          playerVars: {
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
            start: Math.floor(startTime),
          },
          events: {
            onReady: (e: any) => {
              try {
                e.target.playVideo?.();
              } catch {
                // The player might throw if it's not fully ready, fail silently.
              }

              // Poll for current time
              setInterval(() => {
                try {
                  const ct = Number(e.target.getCurrentTime?.() || 0);
                  const d = Number(e.target.getDuration?.() || data.lesson.duration_sec || 0);
                  setCurrentTime(ct);
                  if (d > 0) setDuration(d);
                } catch {
                  // This can fail if the player is destroyed, so we fail silently.
                }
              }, 1000);
            },
            onStateChange: (e: any) => {
              // 0 = ended, 1 = playing, 2 = paused
              if (e.data === 0) {
                // Video ended
                markComplete();
              } else if (e.data === 2 || e.data === 0) {
                // Paused or ended
                saveProgress(e.data === 0);
              }
            },
          },
        });
      } catch (error) {
        console.error('YouTube player initialization failed:', error);
      }
    })();

    return () => {
      if (ytPlayer.current?.destroy) {
        try {
          ytPlayer.current.destroy();
        } catch {
          // This can fail if the player is already destroyed, so we fail silently.
        }
      }
    };
  }, [data?.lesson?.yt_id, isCN]);

  // Fallback video player tracking
  useEffect(() => {
    if (!isCN || !data?.lesson?.cn_alt_url) return;
    const video = vidRef.current;
    if (!video) return;

    const resumePosition = Number(data?.progress?.last_position_sec || 0);
    video.currentTime = resumePosition;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || duration);
    };

    const handlePauseOrEnd = () => {
      saveProgress(video.ended);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePauseOrEnd);
    video.addEventListener('ended', handlePauseOrEnd);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePauseOrEnd);
      video.removeEventListener('ended', handlePauseOrEnd);
    };
  }, [isCN, data?.lesson?.cn_alt_url, data?.progress?.last_position_sec]);

  // Milestone tracking (25%, 50%, 75%)
  useEffect(() => {
    if (!duration) return;

    const pct = currentTime / duration;
    const marks: [number, string][] = [
      [0.25, '25%'],
      [0.5, '50%'],
      [0.75, '75%'],
    ];

    marks.forEach(([threshold, label]) => {
      if (pct >= threshold && !milestones[label]) {
        setMilestones(m => ({ ...m, [label]: true }));
        trackEvent(label);
      }
    });
  }, [currentTime, duration, milestones]);

  const saveProgress = async (completed = false) => {
    saveProgressFn({
      profile_id: profileId,
      lesson_slug: slug,
      last_position_sec: Math.round(currentTime),
      watched_seconds: Math.round(duration || data?.lesson?.duration_sec || 0),
      completed,
    }).catch(console.error);
  };

  const markComplete = async () => {
    await saveProgress(true);
    trackEvent('complete');
    
    // Show funnel upsell dialog after completion
    setShowFunnelDialog(true);
  };

  const trackEvent = (ev: string) => {
    logEventFn({
      profile_id: profileId,
      lesson_slug: slug,
      ev,
      at_sec: Math.round(currentTime),
    }).catch(console.error);
  };

  const chapters = useMemo(
    () => (data?.lesson?.chapters || []) as { t: number; label: string }[],
    [data?.lesson?.chapters]
  );

  const seekTo = (seconds: number) => {
    if (!isCN && ytPlayer.current?.seekTo) {
      ytPlayer.current.seekTo(seconds, true);
    }
    if (isCN && vidRef.current) {
      vidRef.current.currentTime = seconds;
    }
    setCurrentTime(seconds);
    trackEvent('chapter_click');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (showUpsell) {
    return <UpsellModal plan={upsellPlan} onClose={onClose} />;
  }

  if (!data?.lesson) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  const ytSrc = `https://www.youtube-nocookie.com/embed/${data.lesson.yt_id}`;
  const poster =
    data.lesson.poster_url ||
    (data.lesson.yt_id ? `https://i.ytimg.com/vi/${data.lesson.yt_id}/hqdefault.jpg` : '');

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
        {!isCN && data.lesson.yt_id ? (
          <div ref={ytRef} className="w-full h-full" />
        ) : data.lesson.cn_alt_url ? (
          <video
            ref={vidRef}
            controls
            playsInline
            autoPlay
            className="w-full h-full"
            poster={poster}
          >
            <source src={data.lesson.cn_alt_url} type="video/mp4" />
            {data.lesson.captions_vtt_url && (
              <track
                src={data.lesson.captions_vtt_url}
                kind="subtitles"
                srcLang="zh"
                label="中文"
                default
              />
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
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Title and summary */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{data.lesson.title_en}</h2>
        {data.lesson.summary_en && (
          <p className="text-muted-foreground mb-4">{data.lesson.summary_en}</p>
        )}

        {/* Chapters */}
        {chapters.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Chapters</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => seekTo(chapter.t)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                >
                  <span className="font-mono text-xs text-muted-foreground min-w-[50px]">
                    {formatTime(chapter.t)}
                  </span>
                  <span className="text-sm">{chapter.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              trackEvent('cta_book');
              await saveProgress();
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
