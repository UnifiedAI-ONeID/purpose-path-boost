import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

export default function Payments() {
  useEffect(() => {
    trackEvent('admin_payments_view');
  }, []);

  return (
    <AdminShell>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Plans & Pricing</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage subscription plans, pricing tiers, and billing settings.
        </p>
        <Button asChild>
          <Link to="/admin/pricing">Edit Plans</Link>
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Subscriptions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          View active subscriptions, payment history, and customer billing.
        </p>
        <Button asChild variant="outline">
          <Link to="/admin/bookings">View Subscriptions</Link>
        </Button>
      </Card>
    </div>
    </AdminShell>
  );
}
