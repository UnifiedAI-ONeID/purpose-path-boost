import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';

const getVersion = httpsCallable(functions, 'admin-get-version');
const bumpVersion = httpsCallable(functions, 'admin-bump-version');

export function VersionControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  const fetchCurrentVersion = async () => {
    try {
      const result = await getVersion();
      const data = result.data as { v: number };
      setCurrentVersion(data.v || null);
    } catch (error) {
        console.error('Failed to fetch version:', error);
    }
  };

  const handleBumpVersion = async () => {
    setIsLoading(true);
    try {
      await bumpVersion();
      await fetchCurrentVersion();
      toast.success('Content version bumped! All clients will refresh within seconds.');
    } catch (error) {
      console.error('Failed to bump version:', error);
      toast.error('Failed to bump version. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Invalidation & Version Control</CardTitle>
        <CardDescription>
          Force all clients to refresh by bumping the content version. This clears all caches
          and ensures users see the latest content immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentVersion !== null && (
          <div className="text-sm text-muted-foreground">
            Current content version: <span className="font-mono font-semibold">{currentVersion}</span>
          </div>
        )}
        
        <Button
          onClick={handleBumpVersion}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Invalidate All Caches & Refresh Clients
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>This will automatically bump the version when you:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Update coaching offers or pages</li>
            <li>Modify blog posts or events</li>
            <li>Change translations or feature flags</li>
            <li>Update event tickets or Cal.com event types</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
