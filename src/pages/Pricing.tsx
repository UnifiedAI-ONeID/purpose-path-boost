
import { useState, useEffect } from 'react';
import SmartLink from '@/components/SmartLink';
import SEOHelmet from '@/components/SEOHelmet';
import { auth, db } from '@/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { invokeApi } from '@/lib/api-client';
import { trackEvent } from '@/lib/trackEvent';
import { usePrefs } from '@/prefs/PrefsProvider';

const TIERS = [
  { 
    slug: 'starter', 
    title: 'Starter', 
    m: 29, 
    a: 278.4, 
    features: ['10 lessons/month', '1 live Q&A/month', 'Progress tracking', 'Community access']
  },
  { 
    slug: 'growth', 
    title: 'Growth', 
    m: 79, 
    a: 758.4, 
    features: ['All lessons unlimited', '2 live Q&A/month', 'Priority support', '10% off coaching sessions']
  },
  { 
    slug: 'pro', 
    title: 'Pro+ Coaching', 
    m: 199, 
    a: 1900.8, 
    features: ['All lessons unlimited', '2 live Q&A/month', '1× 45-min coaching session/month', '20% off additional sessions', 'VIP support']
  },
];

export default function Pricing() {
  const { lang } = usePrefs();
  const [cycle, setCycle] = useState<'m' | 'a'>('m');
  const [loading, setLoading] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('pricing_page_view', { lang });
  }, [lang]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const h = params.get('highlight');
    if (h) setHighlight(h);
  }, []);

  async function startCheckout(slug: string, coupon?: string) {
    setLoading(slug);
    
    // Track checkout initiation
    trackEvent('checkout_started', {
      plan_slug: slug,
      interval: cycle === 'm' ? 'month' : 'year',
      lang,
      coupon
    });
    
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please sign in first');
        // Store intent
        sessionStorage.setItem('checkout_intent', JSON.stringify({ slug, cycle, coupon }));
        window.location.href = '/auth?redirect=/pricing';
        return;
      }

      // Get profile_id
      let profileId = null;
      try {
        const q = query(collection(db, 'zg_profiles'), where('auth_user_id', '==', user.uid), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            profileId = snapshot.docs[0].id;
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }

      if (!profileId) {
        toast.error('Profile not found');
        return;
      }

      const data = await invokeApi('/api/billing/create-agreement', {
        method: 'POST',
        body: {
          profile_id: profileId,
          plan_slug: slug,
          interval: cycle === 'm' ? 'month' : 'year',
          coupon
        }
      });
      
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  function applyCoupon(slug: string) {
    const code = prompt('Enter coupon code');
    if (!code) return;
    
    // Validate and apply coupon
    invokeApi('/api/coaching/price-with-discount', {
      method: 'POST',
      body: { 
        offer_slug: slug, 
        coupon: code,
        currency: 'USD' 
      }
    })
      .then(data => {
        if (data.ok) {
          toast.success(`Coupon applied! ${data.discount_pct}% off`);
          // Add coupon to checkout
          startCheckout(slug, code);
        } else {
          toast.error(data.error || 'Invalid coupon');
        }
      })
      .catch(() => toast.error('Failed to validate coupon'));
  }

  return (
    <>
      <SEOHelmet
        title="Pricing"
        description="Choose the perfect plan for your growth journey. Start free, upgrade anytime."
      />

      <header className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-br from-primary to-primary/80">
        <h1 className="text-3xl md:text-4xl font-semibold">Choose your path</h1>
        <p className="opacity-90 mt-2">Start free. Upgrade any time.</p>
        
        <div className="mt-4 inline-flex gap-2 p-1 bg-white/10 rounded-lg backdrop-blur-sm">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              cycle === 'm' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setCycle('m')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              cycle === 'a' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setCycle('a')}
          >
            Annual
            <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Save 20%</span>
          </button>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {/* Free tier */}
        <div className="card">
          <div className="text-xl font-semibold">Free</div>
          <div className="text-3xl mt-2">
            $0
            <span className="text-sm text-muted-foreground">/forever</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>3 lessons/month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Basic progress tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Community access</span>
            </li>
          </ul>
          <SmartLink to="/auth?redirect=/dashboard" className="block mt-6">
            <button className="btn w-full">Get started free</button>
          </SmartLink>
        </div>

        {/* Paid tiers */}
        {TIERS.map((tier) => {
          const price = cycle === 'm' ? tier.m : tier.a;
          const isHighlighted = highlight === tier.slug;
          
          return (
            <div
              key={tier.slug}
              className={`card relative ${
                isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
            >
              {tier.slug === 'growth' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="text-xl font-semibold">{tier.title}</div>
              <div className="text-3xl mt-2">
                ${price}
                <span className="text-sm text-muted-foreground">/{cycle === 'm' ? 'mo' : 'yr'}</span>
              </div>
              
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className={`btn w-full mt-6 ${
                  tier.slug === 'growth' ? 'btn-cta' : ''
                }`}
                onClick={() => startCheckout(tier.slug)}
                disabled={loading === tier.slug}
              >
                {loading === tier.slug ? 'Processing...' : `Get ${tier.title}`}
              </button>
              
              <button
                className="btn btn-ghost w-full mt-2"
                onClick={() => applyCoupon(tier.slug)}
              >
                Have a coupon?
              </button>
            </div>
          );
        })}
      </section>

      <section className="mt-8 card">
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-4">
          <div>
            <div className="font-medium">Can I cancel anytime?</div>
            <p className="text-sm text-muted-foreground mt-1">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <div className="font-medium">What payment methods do you accept?</div>
            <p className="text-sm text-muted-foreground mt-1">
              We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.
            </p>
          </div>
          <div>
            <div className="font-medium">Can I switch plans?</div>
            <p className="text-sm text-muted-foreground mt-1">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated based on your current billing cycle.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
