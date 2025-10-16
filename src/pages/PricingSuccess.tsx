import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import SiteShell from '@/components/SiteShell';
import { telemetry } from '@/lib/telemetry';

export default function PricingSuccess() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'starter';
  const interval = searchParams.get('interval') || 'month';

  useEffect(() => {
    telemetry.completeCheckout(plan);
  }, [plan]);

  const isPro = plan === 'pro';

  return (
    <SiteShell>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card max-w-lg w-full text-center p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-semibold mb-2">Success! Your plan is active.</h1>
          <p className="text-muted-foreground mb-6">
            Welcome to <span className="capitalize">{plan}</span>. Your subscription is now active.
          </p>

          <div className="space-y-3">
            <Link to="/dashboard" className="btn w-full">
              Go to dashboard
            </Link>
            
            {isPro && (
              <Link to="/coaching" className="btn btn-ghost w-full">
                Book your monthly coaching
              </Link>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Billing cycle: {interval === 'month' ? 'Monthly' : 'Annual'}
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
