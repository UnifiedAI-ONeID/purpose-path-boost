export type CtaRule = {
  id: string;
  match: { text?: RegExp[]; hrefStartsWith?: string[]; onClickContains?: RegExp[]; role?: string[] };
  route: (ctx: { file: string; existingHref?: string; slugGuess?: string }) => { href?: string; onClickReplacement?: string; note?: string };
};

const coachingDefaultSlug = 'discovery-60';

export const CTA_RULES: CtaRule[] = [
  // Book session → coaching (canonical)
  {
    id: 'book->coaching',
    match: { text: [/book a (session|call)/i, /free (discovery|intro)/i], hrefStartsWith: ['/book'] },
    route: () => ({ href: `/coaching/${coachingDefaultSlug}`, note: 'Rerouted legacy /book to /coaching' })
  },
  {
    id: 'book-btn-nohref->coaching',
    match: { text: [/book/i], role: ['button'] },
    route: () => ({ href: `/coaching/${coachingDefaultSlug}`, note: 'Button now links to coaching' })
  },

  // Global "Coaching" hub link
  {
    id: 'go->coaching-hub',
    match: { text: [/see all options|all coaching/i], hrefStartsWith: ['/book', '/home', '/'] },
    route: () => ({ href: `/coaching`, note: 'Hub page' })
  },

  // Events register → prefer Cal.com mapping if exists, else in-app sheet
  {
    id: 'events->register',
    match: { text: [/register|save my seat|join/i], hrefStartsWith: ['/events'] },
    route: ({ existingHref }) => {
      const slug = existingHref?.split('/').pop() || '';
      return { href: `/events/${slug}#register`, note: 'Uses EventRegisterSheet or Cal.com embed if mapped' };
    }
  },

  // Contact → priority consult bottom sheet
  {
    id: 'contact->priority',
    match: { text: [/priority consult|fast track|skip the line/i], hrefStartsWith: ['/contact'] },
    route: () => ({ href: `/contact#priority`, note: 'Opens ExpressPaySheet' })
  },

  // Admin CTAs
  {
    id: 'admin->install',
    match: { text: [/install admin app/i], hrefStartsWith: ['/admin'] },
    route: () => ({ href: `/admin#install`, note: 'Admin PWA install button' })
  },

  // Coaching specific programs
  {
    id: 'coaching->specific',
    match: { text: [/dreambuilder|life mastery|vip|private/i], hrefStartsWith: ['/coaching'] },
    route: ({ existingHref, slugGuess }) => {
      const slug = slugGuess || existingHref?.split('/').pop() || 'discovery-60';
      return { href: `/coaching/${slug}`, note: 'Specific coaching program' };
    }
  }
];

export const FORBIDDEN_PATTERNS = [
  /\/book\b/i,                    // legacy path
  /\/book-session\b/i,            // legacy path
  /\bcrypto|web3|metamask|ethers|nft|bitcoin|ethereum\b/i // purged capabilities
];
