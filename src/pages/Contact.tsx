/**
 * @file Renders the main contact page with a multi-language form and priority booking options.
 */

import { useEffect, useMemo, useState, useCallback, FormEvent } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import ExpressPaySheet from '@/components/mobile/ExpressPaySheet';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { fx } from '@/lib/edge';
import { toast } from 'sonner';
import { invokeApi } from '@/lib/api-client';
import { logger } from '@/lib/log';
import { trackEvent } from '@/lib/trackEvent';

// --- Type Definitions ---
type Lang = 'en' | 'zh-CN' | 'zh-TW';
type Status = 'idle' | 'ok' | 'err';

// ... (translations and options data can be moved to a separate file for cleanliness if they grow)

// --- Main Component ---
export default function ContactPage() {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState<Lang>('en');
  const [sent, setSent] = useState<Status>('idle');
  const [busy, setBusy] = useState(false);
  
  // ... (other state hooks)

  const t = translations[lang];

  useEffect(() => {
    // Component did mount logic
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    // ... (submit logic)
    setBusy(false);
  }, []);

  const handleExpressPay = useCallback(async () => {
    // ... (express pay logic)
  }, []);
  
  return (
    <>
      <main className="container mx-auto px-4 py-12 space-y-8 max-w-6xl">
        {/* ... */}
        <ContactForm t={t} onSubmit={handleSubmit} busy={busy} sent={sent} />
        {/* ... */}
      </main>
      {/* ... */}
    </>
  );
}

// --- Sub-components ---

const ContactForm = ({ t, onSubmit, busy, sent }) => (
    <form onSubmit={onSubmit}>
        {/* ... form fields ... */}
        <button type="submit" disabled={busy}>
            {busy ? 'Sending...' : t.submit}
        </button>
        {sent === 'ok' && <p>{t.success}</p>}
        {sent === 'err' && <p>{t.fail}</p>}
    </form>
);

// ... (other sub-components like PriorityLane, ContactInfo, etc.)
