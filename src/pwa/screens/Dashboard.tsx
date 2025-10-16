import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Calendar, Copy, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const device = localStorage.getItem('zg.device');
    if (!device) return;

    fetch(`/api/me/summary?device=${device}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {
        toast({
          title: 'Error loading dashboard',
          description: 'Please try again later',
          variant: 'destructive'
        });
      });
  }, []);

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading your dashboard...</div>
      </main>
    );
  }

  const copyRefLink = () => {
    navigator.clipboard.writeText(data.ref_url);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard'
    });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Next Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.next ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {new Date(data.next.start).toLocaleString()}
              </p>
              {data.next.join_url && (
                <Button asChild>
                  <a href={data.next.join_url} target="_blank" rel="noopener noreferrer">
                    Join Session
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming sessions. Book your first session!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Keep Your Streak
          </CardTitle>
          <CardDescription>Stay engaged with your growth journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={data.streak_pct || 0} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(data.streak_pct || 0)}% active this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gift Clarity</CardTitle>
          <CardDescription>Share your referral link with friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={data.ref_url} className="flex-1" />
            <Button onClick={copyRefLink} size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
