import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Install ZhenGrowth</CardTitle>
          <CardDescription>
            Get the full app experience with offline access and faster loading
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Already Installed!</h3>
              <p className="text-muted-foreground mb-6">
                You can find ZhenGrowth on your home screen
              </p>
              <Button asChild>
                <a href="/home">Go to App</a>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Works Offline</h4>
                    <p className="text-sm text-muted-foreground">
                      Access your content even without internet
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Fast & Native</h4>
                    <p className="text-sm text-muted-foreground">
                      Loads instantly like a real app
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Home Screen</h4>
                    <p className="text-sm text-muted-foreground">
                      Quick access from your device
                    </p>
                  </div>
                </div>
              </div>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Install App
                </Button>
              ) : (
                <div className="text-center p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    To install on your device:
                  </p>
                  <div className="text-sm space-y-2 text-left">
                    <p><strong>iOS:</strong> Tap Share → Add to Home Screen</p>
                    <p><strong>Android:</strong> Tap Menu → Install App</p>
                  </div>
                </div>
              )}

              <Button 
                asChild
                variant="outline"
                className="w-full"
              >
                <a href="/home">Continue in Browser</a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}