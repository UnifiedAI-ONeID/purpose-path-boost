import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getPrimaryFunnelForLesson, type Funnel } from '@/lib/funnels';
import { useNavigate } from 'react-router-dom';

interface FunnelUpsellDialogProps {
  lessonSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FunnelUpsellDialog({ lessonSlug, open, onOpenChange }: FunnelUpsellDialogProps) {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      const result = await getPrimaryFunnelForLesson(lessonSlug);
      setFunnel(result);
      setLoading(false);
    })();
  }, [lessonSlug, open]);

  if (!open || loading) {
    return null;
  }

  // If no funnel is attached to this lesson, don't show anything
  if (!funnel) {
    return null;
  }

  const headline = funnel.config?.copy?.headline || 'Unlock More Content';
  const subtitle = funnel.config?.copy?.sub || 'Upgrade to continue your journey';
  const ctaHref = funnel.config?.cta || `/pricing?highlight=${funnel.target_plan_slug}`;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate(ctaHref);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{headline}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleUpgrade}
          >
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
