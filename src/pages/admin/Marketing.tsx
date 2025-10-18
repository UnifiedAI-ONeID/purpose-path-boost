import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';

export default function Marketing() {
  return (
    <AdminShell>
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Marketing & Cross-posting</h1>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Cross-post to Social</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Publish blog posts to LinkedIn, Facebook, X, WeChat, and 小紅書.
          </p>
          <Button asChild>
            <Link to="/admin/marketing/crosspost">Open Cross-post Studio</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Coupons & Discounts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage discount codes for coaching programs.
          </p>
          <Button asChild>
            <Link to="/admin/marketing/coupons">Manage Coupons</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Referral Program</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure invite-a-friend rewards and track referrals.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin/marketing/referrals">Referral Settings</Link>
          </Button>
        </Card>
      </div>
    </div>
    </AdminShell>
  );
}
