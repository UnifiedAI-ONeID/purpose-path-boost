import { Share2, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useWebShare } from '@/hooks/useWebShare';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareButton({ 
  title, 
  text, 
  url, 
  variant = 'outline',
  size = 'default',
  className 
}: ShareButtonProps) {
  const { share, canShare } = useWebShare();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    
    if (canShare) {
      // Use native share
      const success = await share({ title, text, url: shareUrl });
      if (success) {
        toast({ description: 'Shared successfully!' });
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({ description: 'Link copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({ 
          description: 'Failed to copy link', 
          variant: 'destructive' 
        });
      }
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleShare}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        canShare ? (
          <Share2 className="h-4 w-4 mr-2" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )
      )}
      {size !== 'icon' && (canShare ? 'Share' : copied ? 'Copied' : 'Copy Link')}
    </Button>
  );
}
