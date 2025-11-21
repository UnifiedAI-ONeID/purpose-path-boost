import { useEffect, useState } from 'react';
import SmartLink from './SmartLink';
import { usePrefs } from '../prefs/PrefsProvider';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { sanitizeHtml } from '@/lib/sanitize';

type SuggestionData = {
  ok: boolean;
  cached?: boolean;
  headline?: string;
  suggestion_md?: string;
  action_url?: string;
  score?: number;
};

export default function SuggestedNextStep({ profileId }: { profileId: string }) {
  const { lang } = usePrefs();
  const [data, setData] = useState<SuggestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuggestion = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('pwa-ai-suggest', {
        body: { profile_id: profileId }
      });
      
      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error('Error loading suggestion:', error);
      setData({ ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestion();
  }, [profileId, lang]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestion();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!data?.ok || !data.suggestion_md) return null;

  return (
    <Card className="p-4 border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {lang === 'zh-CN' ? '建议的下一步' : lang === 'zh-TW' ? '建議的下一步' : 'Suggested next step'}
        </div>
        {data.cached && (
          <span className="text-xs text-muted-foreground">
            {lang === 'zh-CN' ? '已缓存' : lang === 'zh-TW' ? '已快取' : 'Cached'}
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-semibold mb-3">{data.headline}</h3>
      
      <div 
        className="prose prose-sm max-w-none text-muted-foreground mb-4"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(mdToHtml(data.suggestion_md)) }}
      />
      
      <div className="flex gap-2">
        {data.action_url && (
          <SmartLink to={data.action_url}>
            <Button size="sm" className="gap-2">
              {lang === 'zh-CN' ? '去做' : lang === 'zh-TW' ? '去做' : 'Do this'}
            </Button>
          </SmartLink>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {lang === 'zh-CN' ? '刷新' : lang === 'zh-TW' ? '重新整理' : 'Refresh'}
        </Button>
      </div>
    </Card>
  );
}

function mdToHtml(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n{2,}/g, '<br/>');
}
