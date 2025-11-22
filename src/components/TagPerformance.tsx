
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { startOfWeek, format } from 'date-fns';

type Row = {
  tag: string;
  week_start: string;
  post_count: number;
  impressions: number;
  engagements: number;
  clicks: number | null;
  video_views: number | null;
  er_pct: number;
  ctr_pct: number | null;
};

type Summary = {
  tag: string;
  posts: number;
  imp: number;
  eng: number;
  ctr: number | null;
  er: number;
  trend: number[];
};

function Spark({ data }: { data: number[] }) {
  if (!data.length) return <div className="h-10" />;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={pts}
        opacity=".75"
      />
    </svg>
  );
}

export default function TagPerformance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [minPosts, setMinPosts] = useState(3);
  const [sortKey, setSortKey] = useState<'er' | 'ctr' | 'imp'>('er');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all posts which contain tags and potentially metrics
        // In a real scenario, we might need to join with social_metrics collection
        const postsSnapshot = await getDocs(query(collection(db, 'social_posts')));
        
        const tagStats = new Map<string, any>(); // Key: tag_weekstart

        postsSnapshot.forEach(doc => {
            const data = doc.data();
            const tags = data.tags || [];
            if (!Array.isArray(tags)) return;

            const createdAt = data.created_at?.seconds ? new Date(data.created_at.seconds * 1000) : new Date();
            const weekStart = format(startOfWeek(createdAt), 'yyyy-MM-dd');

            // Metrics (assuming they are on the post object for now, or default to 0)
            const imp = data.impressions || 0;
            const eng = (data.likes || 0) + (data.comments || 0) + (data.shares || 0);
            const clicks = data.clicks || 0;
            const views = data.video_views || 0;

            tags.forEach((tag: string) => {
                const key = `${tag}_${weekStart}`;
                if (!tagStats.has(key)) {
                    tagStats.set(key, { 
                        tag, 
                        week_start: weekStart, 
                        post_count: 0, 
                        impressions: 0, 
                        engagements: 0, 
                        clicks: 0, 
                        video_views: 0 
                    });
                }
                const stat = tagStats.get(key);
                stat.post_count++;
                stat.impressions += imp;
                stat.engagements += eng;
                stat.clicks += clicks;
                stat.video_views += views;
            });
        });

        const calculatedRows: Row[] = Array.from(tagStats.values()).map(stat => {
            const imp = stat.impressions;
            const eng = stat.engagements;
            const clk = stat.clicks;
            return {
                ...stat,
                er_pct: imp ? +((eng / imp) * 100).toFixed(2) : 0,
                ctr_pct: imp && clk ? +((clk / imp) * 100).toFixed(2) : null
            };
        });

        setRows(calculatedRows);
      } catch (error) {
        console.error("Error fetching tag performance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const byTag = useMemo(() => {
    const m: Record<string, Row[]> = {};
    for (const r of rows) (m[r.tag] ||= []).push(r);
    // sort weeks chronologically
    for (const k in m)
      m[k].sort((a, b) => +new Date(a.week_start) - +new Date(b.week_start));
    return m;
  }, [rows]);

  const summaries = useMemo(() => {
    const out = Object.entries(byTag)
      .map(([tag, arr]) => {
        const posts = arr.reduce((a, b) => a + b.post_count, 0);
        const imp = arr.reduce((a, b) => a + b.impressions, 0);
        const eng = arr.reduce((a, b) => a + b.engagements, 0);
        const clk = arr.reduce((a, b) => a + (b.clicks || 0), 0);
        const er = imp ? +((eng / imp) * 100).toFixed(2) : 0;
        const ctr = imp && clk ? +((clk / imp) * 100).toFixed(2) : null;
        return {
          tag,
          posts,
          imp,
          eng,
          ctr,
          er,
          trend: arr.map((w) => w.er_pct),
        };
      })
      .filter((s) => s.posts >= minPosts);

    return out.sort((a, b) => {
      if (sortKey === 'er') return b.er - a.er || b.imp - a.imp;
      if (sortKey === 'ctr')
        return (b.ctr || 0) - (a.ctr || 0) || b.imp - a.imp;
      return b.imp - a.imp;
    });
  }, [byTag, minPosts, sortKey]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tag Performance</h2>
          <p className="text-sm text-muted-foreground">
            Analyze which tags drive the most engagement
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="min-posts" className="text-sm">
              Min posts:
            </Label>
            <input
              id="min-posts"
              type="number"
              min={1}
              className="px-2 py-1 w-20 rounded-md border border-border bg-background"
              value={minPosts}
              onChange={(e) => setMinPosts(+e.target.value || 1)}
            />
          </div>
          <select
            className="px-3 py-1 rounded-md border border-border bg-background"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
          >
            <option value="er">Sort by ER%</option>
            <option value="ctr">Sort by CTR%</option>
            <option value="imp">Sort by Impressions</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="py-3 px-4 font-medium">Tag</th>
              <th className="py-3 px-4 font-medium">Posts</th>
              <th className="py-3 px-4 font-medium">Impressions</th>
              <th className="py-3 px-4 font-medium">Engagements</th>
              <th className="py-3 px-4 font-medium">ER%</th>
              <th className="py-3 px-4 font-medium">CTR%</th>
              <th className="py-3 px-4 font-medium">Trend (ER%)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-6 px-4 text-center text-muted-foreground" colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : summaries.length === 0 ? (
              <tr>
                <td className="py-6 px-4 text-center text-muted-foreground" colSpan={7}>
                  No tag performance data yet. Posts need tags assigned and metrics collected.
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr key={s.tag} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">#{s.tag}</td>
                  <td className="py-3 px-4">{s.posts}</td>
                  <td className="py-3 px-4">{s.imp.toLocaleString()}</td>
                  <td className="py-3 px-4">{s.eng.toLocaleString()}</td>
                  <td className="py-3 px-4">{s.er.toFixed(2)}%</td>
                  <td className="py-3 px-4">
                    {s.ctr == null ? '–' : `${s.ctr.toFixed(2)}%`}
                  </td>
                  <td className="py-3 px-4">
                    <Spark data={s.trend} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SuggestionBar summaries={summaries} />
    </Card>
  );
}

function SuggestionBar({ summaries }: { summaries: Summary[] }) {
  if (!summaries.length) return null;

  // Heuristics for actionable suggestions
  const topER = [...summaries].sort((a, b) => b.er - a.er)[0];
  const topCTR = [...summaries]
    .filter((s) => s.ctr != null)
    .sort((a, b) => (b.ctr || 0) - (a.ctr || 0))[0];
  const promising = [...summaries]
    .filter((s) => s.posts < 5 && s.er > 2)
    .sort((a, b) => b.er - a.er)[0];

  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
      <div className="font-medium text-sm">💡 Actionable Suggestions</div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
        {topER && (
          <li>
            Double-down on <strong className="text-foreground">#{topER.tag}</strong>: best
            Engagement Rate ({topER.er.toFixed(2)}%). Schedule 2 more posts next week.
          </li>
        )}
        {topCTR && (
          <li>
            Consider <strong className="text-foreground">#{topCTR.tag}</strong> for link posts:
            highest CTR ({(topCTR.ctr || 0).toFixed(2)}%). Use clear CTA + benefit bullets.
          </li>
        )}
        {promising && (
          <li>
            Test more of <strong className="text-foreground">#{promising.tag}</strong>: strong
            ER ({promising.er.toFixed(2)}%) but low volume (only {promising.posts} posts).
          </li>
        )}
      </ul>
    </div>
  );
}
