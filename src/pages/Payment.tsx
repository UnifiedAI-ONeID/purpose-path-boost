import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { COACHING_PACKAGES, type CoachingPackageId, createPaymentLink } from '@/lib/airwallex';
import { track } from '@/analytics/events';
import { toast } from 'sonner';
import { isCN } from '@/lib/cn-env';

const paymentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const packageId = (searchParams.get('package') || 'single') as CoachingPackageId;
  const selectedPackage = COACHING_PACKAGES[packageId];
  
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  useEffect(() => {
    if (!selectedPackage || selectedPackage.price === 0) {
      navigate('/coaching');
    }
  }, [selectedPackage, navigate]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    
    // Detect currency based on region
    const currency = isCN ? 'CNY' : selectedPackage.currency;
    const amount = isCN ? selectedPackage.price * 7 : selectedPackage.price; // Rough CNY conversion
    
    track('pay_click', {
      package: packageId,
      amount,
      currency,
    });

    try {
      // Create payment link via API
      const response = await createPaymentLink({
        amount,
        currency,
        description: `${selectedPackage.name} - ZhenGrowth Coaching`,
        customerEmail: data.email,
        customerName: data.name,
        metadata: {
          package: packageId,
          packageName: selectedPackage.name,
          region: isCN ? 'CN' : 'global',
        },
      });

      // Redirect to Airwallex hosted payment page
      window.location.href = response.url;
    } catch (error) {
      console.error('Payment error:', error);
      track('pay_fail', {
        package: packageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to create payment link. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  if (!selectedPackage) {
    return null;
  }

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold mb-4">
              Complete Your Purchase
            </h1>
            <p className="text-xl text-muted-foreground">
              You're one step away from transforming your career
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Order Summary */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg">{selectedPackage.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPackage.duration}
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {selectedPackage.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-brand-accent flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-brand-accent">
                        {isCN ? `¥${(selectedPackage.price * 7).toFixed(0)}` : `$${selectedPackage.price}`} {isCN ? 'CNY' : selectedPackage.currency}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p className="font-medium mb-2">Payment Methods</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>{isCN ? 'WeChat Pay, Alipay, UnionPay' : 'Credit Card, WeChat Pay, Alipay'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.email.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Receipt and session details will be sent to this email
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">Secure Payment</p>
                          <p className="text-muted-foreground">
                            Your payment is processed securely through Airwallex. We never
                            see or store your payment information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="cta"
                      size="lg"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment
                          <CreditCard className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By proceeding, you agree to our{' '}
                      <a href="/terms" className="underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="underline">
                        Privacy Policy
                      </a>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Payment;
