import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';

export default function Marketing() {
  return (
    <AdminShell>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Cross-post to Social</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Publish blog posts to LinkedIn, Facebook, X, and 小紅書 (China).
        </p>
        <Button asChild>
          <Link to="/admin">Open Cross-post</Link>
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Referrals & Coupons</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage invite-a-friend settings, create coupons, and track redemptions.
        </p>
        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/admin/coupons">Manage Coupons</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/admin">Referral Settings</Link>
          </Button>
        </div>
      </Card>
    </div>
    </AdminShell>
  );
}
