import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestPromptProps {
  feature: string;
  description?: string;
}

export function GuestPrompt({ feature, description }: GuestPromptProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 text-center max-w-md mx-auto mt-8">
      <div className="mb-4 flex justify-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Sign in to access {feature}</h3>
      {description && (
        <p className="text-muted-foreground mb-6">{description}</p>
      )}
      <div className="flex flex-col gap-3">
        <Button 
          size="lg" 
          onClick={() => navigate('/auth?returnTo=' + encodeURIComponent(window.location.pathname))}
        >
          <User className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => navigate('/auth?mode=signup&returnTo=' + encodeURIComponent(window.location.pathname))}
        >
          Create Account
        </Button>
      </div>
    </Card>
  );
}
