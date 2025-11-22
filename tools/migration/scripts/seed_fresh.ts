import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { db } from '../lib/firebase';

dotenv.config();

/**
 * SEED SCRIPT
 * Initializes a FRESH Firestore database with necessary configuration.
 * USE WITH CAUTION: This is for setting up a new environment, not migrating data.
 */

const TIERS = [
  { 
    slug: 'starter', 
    title: 'Starter', 
    description: 'For beginners',
    price: 29, 
    currency: 'USD',
    features: ['10 lessons/month', '1 live Q&A/month', 'Progress tracking', 'Community access'],
    active: true
  },
  { 
    slug: 'growth', 
    title: 'Growth', 
    description: 'Most popular choice',
    price: 79, 
    currency: 'USD',
    features: ['All lessons unlimited', '2 live Q&A/month', 'Priority support', '10% off coaching sessions'],
    active: true
  },
  { 
    slug: 'pro', 
    title: 'Pro+ Coaching', 
    description: 'Maximum impact',
    price: 199, 
    currency: 'USD',
    features: ['All lessons unlimited', '2 live Q&A/month', '1× 45-min coaching session/month', '20% off additional sessions', 'VIP support'],
    active: true
  },
];

const EVENT_TYPES = [
  {
    id: 'consultation',
    name: 'Free Consultation',
    slug: 'consult',
    duration: 15,
    description: 'Brief chat to see if we are a good fit.',
    active: true
  },
  {
    id: 'coaching-session',
    name: '1:1 Coaching Session',
    slug: 'coaching',
    duration: 45,
    description: 'Deep dive into your goals.',
    active: true
  }
];

async function seed() {
  console.log('Seeding fresh database...');

  // 1. Seed Coaching Offers (Products)
  console.log('Seeding Products...');
  for (const tier of TIERS) {
    await db.collection('coaching_offers').doc(tier.slug).set(tier);
  }

  // 2. Seed Calendar Event Types
  console.log('Seeding Event Types...');
  for (const type of EVENT_TYPES) {
    await db.doc(`config/calendar/types/${type.id}`).set(type);
  }

  // 3. Seed System Config
  console.log('Seeding System Config...');
  await db.doc('config/system').set({
    version: '1.0.0',
    maintenanceMode: false,
    minAppVersion: '1.0.0'
  });

  console.log('Seeding complete.');
}

seed().catch(console.error);
