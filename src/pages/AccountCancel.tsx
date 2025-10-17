import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { invokeApi } from '@/lib/api-client';

export default function AccountCancel() {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function keepWithDiscount() {
    setLoading(true);
    try {
      const code = 'STAY15';
      await invokeApi('/api/admin/coupons/save', {
        method: 'POST',
        body: {
          code,
          percent_off: 15,
          expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          applies_to: ['starter', 'growth', 'pro'],
        }
      });
      navigate(`/pricing?coupon=${code}`);
    } catch (error) {
      console.error('Error creating retention coupon:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitCancel() {
    setLoading(true);
    try {
      const profile_id = localStorage.getItem('zg.profile') || '';
      await invokeApi('/api/churn/intent', {
        method: 'POST',
        body: { reason, profile_id }
      });
      navigate('/account/cancel/confirm');
    } catch (error) {
      console.error('Error submitting churn intent:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card max-w-lg w-full p-8">
          <h1 className="text-2xl font-semibold mb-2">Before you go</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Would any of these help you stay?
          </p>

          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={keepWithDiscount}
              disabled={loading}
            >
              Get 15% off next 3 months
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/account/pause')}
            >
              Pause for 1 month
            </Button>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Tell us why you're leaving</label>
            <Textarea
              placeholder="Your feedback helps us improve..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <Button
              variant="ghost"
              className="w-full"
              onClick={submitCancel}
              disabled={loading}
            >
              Continue to cancel
            </Button>
          </div>
        </div>
      </div>
  );
}
