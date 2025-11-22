import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db';

type NpsQuickProps = {
  profileId: string;
};

export default function NpsQuick({ profileId }: NpsQuickProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const storageKey = `nps_seen_${currentMonth}`;
    
    if (!localStorage.getItem(storageKey)) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleVote = async (score: number) => {
    try {
      await supabase.functions.invoke('api-telemetry-log', {
        body: {
          event: 'nps_vote',
          props: { score },
          profile_id: profileId,
          ts: Date.now()
        }
      });

      const currentMonth = new Date().toISOString().slice(0, 7);
      localStorage.setItem(`nps_seen_${currentMonth}`, '1');
      setShow(false);
    } catch (error) {
      console.error('[NpsQuick] Error recording vote:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm font-medium mb-3">
          How likely are you to recommend ZhenGrowth to a friend?
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map(score => (
            <Button
              key={score}
              variant="outline"
              size="sm"
              onClick={() => handleVote(score)}
              className="min-w-[40px]"
            >
              {score}
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </CardContent>
    </Card>
  );
}
