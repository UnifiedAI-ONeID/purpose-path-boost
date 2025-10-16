import SmartLink from './SmartLink';

interface UpsellModalProps {
  plan?: string;
  onClose: () => void;
}

export default function UpsellModal({ plan = 'starter', onClose }: UpsellModalProps) {
  const planInfo = {
    starter: { title: 'Starter', desc: '10 lessons/month + live Q&A' },
    growth: { title: 'Growth', desc: 'All lessons unlimited + 2 Q&A/month' },
    pro: { title: 'Pro+ Coaching', desc: 'All lessons + coaching sessions' }
  }[plan] || { title: 'Premium', desc: 'Unlock all features' };

  return (
    <div 
      className="fixed inset-0 bg-black/60 grid place-items-center p-3 z-[1000]" 
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xl font-semibold">Unlock this lesson</div>
        <p className="text-sm text-muted-foreground mt-2">
          Get <span className="font-medium text-foreground">{planInfo.desc}</span> with our {planInfo.title} plan.
        </p>
        
        <div className="mt-6 flex gap-3">
          <SmartLink to={`/pricing?highlight=${plan}`} className="flex-1">
            <button className="btn btn-cta w-full">
              See plans
            </button>
          </SmartLink>
          <button className="btn btn-ghost" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
