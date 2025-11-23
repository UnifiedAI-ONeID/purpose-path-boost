
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { loadYouTubeAPI, YouTubePlayer } from '@/lib/youtubeApi';
import UpsellModal from './UpsellModal';
import { FunnelUpsellDialog } from './FunnelUpsellDialog';
import { toast } from 'sonner';
import { functions } from '@/firebase/config'; 
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// Firebase Cloud Functions
const paywallCanWatch = httpsCallable(functions, 'api-paywall-can-watch');
const paywallMarkWatch = httpsCallable(functions, 'api-paywall-mark-watch');
const getLesson = httpsCallable(functions, 'api-lessons-get');
const saveProgressFn = httpsCallable(functions, 'api-lessons-progress');
const logEventFn = httpsCallable(functions, 'api-lessons-event');

// Type definitions
interface Chapter {
  t: number;
  label: string;
}

interface Lesson {
  slug: string;
  title_en: string;
  summary_en?: string;
  yt_id?: string;
  duration_sec?: number;
  poster_url?: string;
  cn_alt_url?: string;
  captions_vtt_url?: string;
  chapters?: Chapter[];
}

interface LessonProgress {
  last_position_sec?: number;
}

interface LessonData {
  lesson: Lesson;
  progress?: LessonProgress;
}

interface LessonPlayerYTProps {
  profileId: string;
  slug: string;
  onClose: () => void;
}

interface PaywallCheckResult {
  access: boolean;
  upsell?: { recommended: string };
  plan_slug?: string;
  remaining?: number;
}

interface LessonResponse {
  ok: boolean;
  lesson: Lesson;
  progress: LessonProgress;
}

// Helper to detect if user is in China
function detectCN(): boolean {
  try {
    return /zh-cn|zh-hans/.test(navigator.language?.toLowerCase() || '');
  } catch {
    return false;
  }
}

export function LessonPlayerYT({ profileId, slug, onClose }: LessonPlayerYTProps) {
  const ytRef = useRef<HTMLDivElement | null>(null);
  const ytPlayer = useRef<YouTubePlayer | null>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);

  const [data, setData] = useState<LessonData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [milestones, setMilestones] = useState<Record<string, boolean>>({});
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellPlan, setUpsellPlan] = useState('starter');
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);
  const isCN = useMemo(() => detectCN(), []);

  const trackEvent = useCallback((ev: string) => {
    logEventFn({
      profile_id: profileId,
      lesson_slug: slug,
      ev,
      at_sec: Math.round(currentTime),
    }).catch(console.error);
  }, [profileId, slug, currentTime]);

  const saveProgress = useCallback(async (completed = false) => {
    await saveProgressFn({
      profile_id: profileId,
      lesson_slug: slug,
      last_position_sec: Math.round(currentTime),
      watched_seconds: Math.round(duration || data?.lesson?.duration_sec || 0),
      completed,
    }).catch(console.error);
  }, [profileId, slug, currentTime, duration, data?.lesson?.duration_sec]);

  const markComplete = useCallback(async () => {
    await saveProgress(true);
    trackEvent('complete');
    setShowFunnelDialog(true);
  }, [saveProgress, trackEvent]);

  // Fetch lesson data and check paywall
  useEffect(() => {
    (async () => {
      try {
        const gateResult: HttpsCallableResult<PaywallCheckResult> = await paywallCanWatch({ profile_id: profileId, lesson_slug: slug });
        const gateCheck = gateResult.data;

        if (!gateCheck?.access) {
          setShowUpsell(true);
          setUpsellPlan(gateCheck?.upsell?.recommended || 'starter');
          return;
        }

        paywallMarkWatch({ profile_id: profileId, lesson_slug: slug }).catch(console.error);

        if (gateCheck.plan_slug === 'free' && gateCheck.remaining === 1) {
          toast('Unlock your next 30 days', {
            action: { label: 'See plans', onClick: () => window.location.href = '/pricing?highlight=starter' }
          });
        }

        const lessonResult: HttpsCallableResult<LessonResponse> = await getLesson({ slug, profile_id: profileId });
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
    if (!data?.lesson?.yt_id || isCN) return;

    let player: YouTubePlayer | null = null;

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();
        if (!ytRef.current) return;

        const startTime = Math.max(0, data.progress?.last_position_sec || 0);

        player = new window.YT.Player(ytRef.current, {
          videoId: data.lesson.yt_id,
          playerVars: { modestbranding: 1, rel: 0, playsinline: 1, origin: window.location.origin, start: Math.floor(startTime) },
          events: {
            onReady: (e) => {
              e.target.playVideo?.();
              setInterval(() => {
                try {
                  const ct = e.target.getCurrentTime?.() || 0;
                  const d = e.target.getDuration?.() || data.lesson.duration_sec || 0;
                  setCurrentTime(ct);
                  if (d > 0) setDuration(d);
                } catch {
                  // This can happen if the player is destroyed, so we ignore it.
                }
              }, 1000);
            },
            onStateChange: (e) => {
              if (e.data === 0) markComplete();
              else if (e.data === 2) saveProgress();
            },
          },
        });
        ytPlayer.current = player;
      } catch (error) {
        console.error('YouTube player init failed:', error);
      }
    };

    initPlayer();

    return () => {
      player?.destroy?.();
    };
  }, [data?.lesson, data?.progress, isCN, markComplete, saveProgress]);

  // Milestone tracking
  useEffect(() => {
    if (!duration) return;
    const pct = currentTime / duration;
    const marks: [number, string][] = [[0.25, '25%'], [0.5, '50%'], [0.75, '75%']];

    marks.forEach(([threshold, label]) => {
      if (pct >= threshold && !milestones[label]) {
        setMilestones(m => ({ ...m, [label]: true }));
        trackEvent(label);
      }
    });
  }, [currentTime, duration, milestones, trackEvent]);

  const seekTo = (seconds: number) => {
    if (ytPlayer.current?.seekTo) ytPlayer.current.seekTo(seconds, true);
    if (vidRef.current) vidRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    trackEvent('chapter_click');
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

  if (showUpsell) return <UpsellModal plan={upsellPlan} onClose={onClose} />;
  if (!data?.lesson) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto mb-4" /><p className="text-muted-foreground">Loading lesson...</p></div>;

  const poster = data.lesson.poster_url || (data.lesson.yt_id ? `https://i.ytimg.com/vi/${data.lesson.yt_id}/hqdefault.jpg` : '');

  return (
    <div>
      <FunnelUpsellDialog lessonSlug={slug} open={showFunnelDialog} onOpenChange={setShowFunnelDialog} />
      <div className="relative aspect-video w-full bg-black">
        {isCN && data.lesson.cn_alt_url ? (
          <video ref={vidRef} controls autoPlay className="w-full h-full" poster={poster}>
            <source src={data.lesson.cn_alt_url} type="video/mp4" />
            {data.lesson.captions_vtt_url && <track src={data.lesson.captions_vtt_url} kind="subtitles" srcLang="zh" label="中文" default />}
          </video>
        ) : (
          <div ref={ytRef} className="w-full h-full" />
        )}
        <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 transition z-10 flex items-center justify-center"><X className="h-5 w-5 text-white" /></button>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{data.lesson.title_en}</h2>
        <p className="text-muted-foreground mb-4">{data.lesson.summary_en || ''}</p>
        {data.lesson.chapters && data.lesson.chapters.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Chapters</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.lesson.chapters.map((ch, i) => (
                <button key={i} onClick={() => seekTo(ch.t)} className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent transition text-left">
                  <span className="font-mono text-xs text-muted-foreground min-w-[50px]">{formatTime(ch.t)}</span>
                  <span className="text-sm">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={async () => { trackEvent('cta_book'); await saveProgress(); window.location.href = '/coaching'; }}>Book a session</Button>
          <Button variant="outline" onClick={async () => { await saveProgress(); onClose(); }}>Save & Close</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
