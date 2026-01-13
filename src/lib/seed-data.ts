/**
 * Seed data for coaching packages and FAQs
 * Run this from the admin console or a separate script to populate Firestore
 */

import { db } from '@/firebase/config';
import { collection, doc, setDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';

// Coaching packages seed data
export const SEED_COACHING_PACKAGES = [
  {
    slug: 'discovery',
    title: 'Discovery Call',
    description: 'A complimentary 30-minute session to explore your goals and see if coaching is right for you.',
    price: 0,
    currency: 'USD',
    duration: '30 minutes',
    features: [
      'Free consultation',
      'Goal clarification',
      'Coaching overview',
      'No commitment required'
    ],
    isActive: true,
    calLink: 'zheng/discovery',
    eventType: 'discovery-call',
    sort: 0,
  },
  {
    slug: 'single-session',
    title: 'Single Session',
    description: 'A focused one-on-one coaching session to tackle a specific challenge or explore a topic in depth.',
    price: 200,
    currency: 'USD',
    duration: '60 minutes',
    features: [
      '60-minute deep dive session',
      'Personalized action plan',
      'Session notes & resources',
      'Email follow-up support'
    ],
    isActive: true,
    calLink: 'zheng/coaching',
    eventType: 'coaching-session',
    sort: 1,
  },
  {
    slug: 'monthly',
    title: 'Monthly Package',
    description: 'Four weekly sessions for sustained momentum and accountability on your growth journey.',
    price: 800,
    currency: 'USD',
    duration: '4 weeks · Weekly sessions',
    features: [
      '4 x 60-minute sessions',
      'Weekly accountability check-ins',
      'Email support between sessions',
      'Progress tracking & milestones',
      'Resource library access'
    ],
    isActive: true,
    calLink: 'zheng/coaching',
    eventType: 'coaching-session',
    sort: 2,
  },
  {
    slug: 'quarterly',
    title: 'Quarterly Transformation',
    description: 'A comprehensive 12-week program for deep transformation and lasting change.',
    price: 1900,
    currency: 'USD',
    duration: '12 weeks · Weekly sessions',
    features: [
      '12 x 60-minute sessions',
      'Comprehensive assessment',
      'Personalized development plan',
      'Priority email & chat support',
      'Mid-program review',
      'Graduation action plan'
    ],
    isActive: true,
    calLink: 'zheng/coaching',
    eventType: 'coaching-session',
    sort: 3,
  },
];

// FAQ seed data
export const SEED_FAQS = [
  // Getting Started
  {
    question: 'What is Purpose Path coaching?',
    answer: 'Purpose Path coaching is a personalized growth journey designed to help you discover your purpose, clarify your goals, and take meaningful action toward the life you want. Our approach combines career coaching, life design, and mindset work.',
    category: 'Getting Started',
    published: true,
    order: 0,
  },
  {
    question: 'How do I get started?',
    answer: 'Start with a free Discovery Call to discuss your goals and see if coaching is right for you. From there, we\'ll recommend the best program or package based on your needs and timeline.',
    category: 'Getting Started',
    published: true,
    order: 1,
  },
  {
    question: 'Who is coaching for?',
    answer: 'Coaching is for anyone looking to grow—whether you\'re navigating a career transition, seeking more fulfillment, building leadership skills, or simply wanting clarity on your next chapter.',
    category: 'Getting Started',
    published: true,
    order: 2,
  },
  // Coaching
  {
    question: 'What happens in a coaching session?',
    answer: 'Each session is tailored to your needs. We typically start by reviewing progress and wins, then dive deep into the topic at hand. You\'ll leave with clear action steps and renewed clarity.',
    category: 'Coaching',
    published: true,
    order: 3,
  },
  {
    question: 'How long are coaching sessions?',
    answer: 'Standard coaching sessions are 60 minutes. Discovery calls are 30 minutes. We keep to time while ensuring you get the support you need.',
    category: 'Coaching',
    published: true,
    order: 4,
  },
  {
    question: 'Are sessions online or in-person?',
    answer: 'All sessions are conducted via video call for maximum flexibility. This allows us to work together regardless of your location.',
    category: 'Coaching',
    published: true,
    order: 5,
  },
  // App Features
  {
    question: 'How do I track my progress?',
    answer: 'The Purpose Path app includes goal tracking, journaling, and insights features. You can set goals, track habits, and review your growth journey all in one place.',
    category: 'App Features',
    published: true,
    order: 6,
  },
  {
    question: 'Is there a mobile app?',
    answer: 'Yes! Purpose Path is a Progressive Web App (PWA) that works on any device. Add it to your home screen for the best experience. It works offline and sends helpful reminders.',
    category: 'App Features',
    published: true,
    order: 7,
  },
  // Account
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a reset link within minutes. Check your spam folder if you don\'t see it.',
    category: 'Account',
    published: true,
    order: 8,
  },
  {
    question: 'Can I change my email address?',
    answer: 'Yes, contact support to update your email address. For security, we\'ll verify your identity before making changes.',
    category: 'Account',
    published: true,
    order: 9,
  },
  // Payments
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor. For larger packages, we can discuss alternative arrangements.',
    category: 'Payments',
    published: true,
    order: 10,
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 100% satisfaction guarantee on your first session. If coaching isn\'t right for you, we\'ll refund your single session or first session of a package. Unused sessions in packages can be refunded on a prorated basis.',
    category: 'Payments',
    published: true,
    order: 11,
  },
  {
    question: 'Can I reschedule a session?',
    answer: 'Yes, you can reschedule up to 24 hours before your session at no charge. Cancellations with less than 24 hours notice may be counted as a used session.',
    category: 'Payments',
    published: true,
    order: 12,
  },
];

/**
 * Seed coaching packages to Firestore
 * Only adds packages that don't already exist (by slug)
 */
export async function seedCoachingPackages(): Promise<{ added: number; skipped: number }> {
  const existingSnapshot = await getDocs(query(collection(db, 'coaching_offers')));
  const existingSlugs = new Set(existingSnapshot.docs.map(d => d.data().slug));
  
  let added = 0;
  let skipped = 0;
  
  for (const pkg of SEED_COACHING_PACKAGES) {
    if (existingSlugs.has(pkg.slug)) {
      skipped++;
      continue;
    }
    
    const docRef = doc(collection(db, 'coaching_offers'));
    await setDoc(docRef, {
      ...pkg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }
  
  return { added, skipped };
}

/**
 * Seed FAQs to Firestore
 * Only adds FAQs that don't already exist (by question text)
 */
export async function seedFAQs(): Promise<{ added: number; skipped: number }> {
  const existingSnapshot = await getDocs(query(collection(db, 'faqs')));
  const existingQuestions = new Set(
    existingSnapshot.docs.map(d => d.data().question?.toLowerCase().trim())
  );
  
  let added = 0;
  let skipped = 0;
  
  for (const faq of SEED_FAQS) {
    if (existingQuestions.has(faq.question.toLowerCase().trim())) {
      skipped++;
      continue;
    }
    
    const docRef = doc(collection(db, 'faqs'));
    await setDoc(docRef, {
      ...faq,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }
  
  return { added, skipped };
}

/**
 * Seed all data
 */
export async function seedAll(): Promise<{
  packages: { added: number; skipped: number };
  faqs: { added: number; skipped: number };
}> {
  const packages = await seedCoachingPackages();
  const faqs = await seedFAQs();
  return { packages, faqs };
}

// Lessons seed data
export const SEED_LESSONS = [
  {
    title: 'Finding Your Core Values',
    slug: 'core-values',
    description: 'Discover what truly matters to you and align your life around your deepest values.',
    content: 'Core values are the fundamental beliefs that guide your decisions and actions. In this lesson, you\'ll learn how to identify your personal values and use them as a compass for your life journey.',
    youtubeId: '',
    duration: '15 min',
    tags: ['values', 'self-discovery', 'foundation'],
    published: true,
    order: 0,
  },
  {
    title: 'Setting Meaningful Goals',
    slug: 'meaningful-goals',
    description: 'Learn the art of setting goals that excite and motivate you toward lasting change.',
    content: 'Not all goals are created equal. This lesson teaches you how to set goals that align with your purpose and values, making them more achievable and fulfilling.',
    youtubeId: '',
    duration: '20 min',
    tags: ['goals', 'planning', 'motivation'],
    published: true,
    order: 1,
  },
  {
    title: 'Building Daily Habits',
    slug: 'daily-habits',
    description: 'Transform your aspirations into automatic behaviors with science-backed habit strategies.',
    content: 'Small daily actions compound into massive results over time. Learn the psychology of habit formation and practical techniques to build routines that stick.',
    youtubeId: '',
    duration: '18 min',
    tags: ['habits', 'routines', 'consistency'],
    published: true,
    order: 2,
  },
  {
    title: 'Overcoming Self-Doubt',
    slug: 'overcoming-self-doubt',
    description: 'Strategies to quiet your inner critic and build unshakeable self-confidence.',
    content: 'Self-doubt is universal but doesn\'t have to hold you back. This lesson provides practical tools to reframe negative thoughts and cultivate genuine confidence.',
    youtubeId: '',
    duration: '22 min',
    tags: ['mindset', 'confidence', 'inner-critic'],
    published: true,
    order: 3,
  },
  {
    title: 'Time Mastery',
    slug: 'time-mastery',
    description: 'Take control of your time and focus on what truly matters with proven strategies.',
    content: 'Time is your most valuable resource. Learn frameworks for prioritization, focus, and energy management that will help you accomplish more of what matters.',
    youtubeId: '',
    duration: '25 min',
    tags: ['productivity', 'time-management', 'focus'],
    published: true,
    order: 4,
  },
];

// Challenges seed data  
export const SEED_CHALLENGES = [
  {
    title: '7-Day Gratitude Challenge',
    description: 'Start each morning by writing down three things you\'re grateful for. Transform your mindset one day at a time.',
    startDate: null,
    endDate: null,
    participantCount: 0,
    prize: 'Exclusive gratitude journal PDF',
    rules: '1. Write 3 gratitudes each morning\n2. Share one in the community (optional)\n3. Complete all 7 days to earn your badge',
    isActive: true,
  },
  {
    title: '30-Day Goal Sprint',
    description: 'Pick one meaningful goal and commit to daily action for 30 days. Build momentum and prove what\'s possible.',
    startDate: null,
    endDate: null,
    participantCount: 0,
    prize: '1-on-1 coaching session raffle entry',
    rules: '1. Set one specific, measurable goal\n2. Take at least one action daily\n3. Log your progress in the app\n4. Complete 25+ days to qualify',
    isActive: true,
  },
  {
    title: '21-Day Journaling Journey',
    description: 'Unlock self-awareness through daily journaling prompts designed to deepen your understanding of yourself.',
    startDate: null,
    endDate: null,
    participantCount: 0,
    prize: 'Advanced journaling guide & templates',
    rules: '1. Complete the daily prompt\n2. Write at least 100 words\n3. Reflect honestly\n4. Complete 18+ days to earn your badge',
    isActive: true,
  },
];

// Testimonials seed data
export const SEED_TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Marketing Director',
    company: 'Tech Startup',
    content: 'The coaching sessions completely transformed my approach to career planning. I went from feeling stuck to landing my dream promotion within 3 months.',
    rating: 5,
    photoUrl: '',
    isActive: true,
    order: 0,
  },
  {
    name: 'James L.',
    role: 'Entrepreneur',
    company: 'Self-employed',
    content: 'I was skeptical about coaching, but the Purpose Path approach is different. It\'s practical, actionable, and Zheng really listens. Best investment I\'ve made in myself.',
    rating: 5,
    photoUrl: '',
    isActive: true,
    order: 1,
  },
  {
    name: 'Michelle K.',
    role: 'Product Manager',
    company: 'Fortune 500',
    content: 'The goal-setting framework alone was worth the entire program. I finally have clarity on what I want and a roadmap to get there.',
    rating: 5,
    photoUrl: '',
    isActive: true,
    order: 2,
  },
  {
    name: 'David R.',
    role: 'Software Engineer',
    company: 'Remote Worker',
    content: 'As someone who overthinks everything, having a coach to cut through the noise and focus on what matters has been invaluable. Highly recommend!',
    rating: 5,
    photoUrl: '',
    isActive: true,
    order: 3,
  },
];

/**
 * Seed lessons to Firestore
 */
export async function seedLessons(): Promise<{ added: number; skipped: number }> {
  const existingSnapshot = await getDocs(query(collection(db, 'lessons')));
  const existingSlugs = new Set(existingSnapshot.docs.map(d => d.data().slug));
  
  let added = 0;
  let skipped = 0;
  
  for (const lesson of SEED_LESSONS) {
    if (existingSlugs.has(lesson.slug)) {
      skipped++;
      continue;
    }
    
    const docRef = doc(collection(db, 'lessons'));
    await setDoc(docRef, {
      ...lesson,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }
  
  return { added, skipped };
}

/**
 * Seed challenges to Firestore
 */
export async function seedChallenges(): Promise<{ added: number; skipped: number }> {
  const existingSnapshot = await getDocs(query(collection(db, 'challenges')));
  const existingTitles = new Set(existingSnapshot.docs.map(d => d.data().title?.toLowerCase()));
  
  let added = 0;
  let skipped = 0;
  
  for (const challenge of SEED_CHALLENGES) {
    if (existingTitles.has(challenge.title.toLowerCase())) {
      skipped++;
      continue;
    }
    
    const docRef = doc(collection(db, 'challenges'));
    await setDoc(docRef, {
      ...challenge,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }
  
  return { added, skipped };
}

/**
 * Seed testimonials to Firestore
 */
export async function seedTestimonials(): Promise<{ added: number; skipped: number }> {
  const existingSnapshot = await getDocs(query(collection(db, 'testimonials')));
  const existingNames = new Set(existingSnapshot.docs.map(d => d.data().name?.toLowerCase()));
  
  let added = 0;
  let skipped = 0;
  
  for (const testimonial of SEED_TESTIMONIALS) {
    if (existingNames.has(testimonial.name.toLowerCase())) {
      skipped++;
      continue;
    }
    
    const docRef = doc(collection(db, 'testimonials'));
    await setDoc(docRef, {
      ...testimonial,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }
  
  return { added, skipped };
}

/**
 * Seed all extended data
 */
export async function seedAllExtended(): Promise<{
  packages: { added: number; skipped: number };
  faqs: { added: number; skipped: number };
  lessons: { added: number; skipped: number };
  challenges: { added: number; skipped: number };
  testimonials: { added: number; skipped: number };
}> {
  const packages = await seedCoachingPackages();
  const faqs = await seedFAQs();
  const lessons = await seedLessons();
  const challenges = await seedChallenges();
  const testimonials = await seedTestimonials();
  return { packages, faqs, lessons, challenges, testimonials };
}
