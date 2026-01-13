import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!process.env.FIREBASE_ADMIN_INITIALIZED) {
  if (process.env.FIREBASE_ADMIN_SA_JSON) {
    // Explicit Service Account (Good for local dev or specific identity)
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SA_JSON);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with Service Account JSON');
    } catch (e) {
      console.error('Failed to parse FIREBASE_ADMIN_SA_JSON', e);
      process.exit(1);
    }
  } else {
    // Application Default Credentials (ADC) - Best for Cloud Run
    initializeApp();
    console.log('Firebase Admin initialized with ADC');
  }
  process.env.FIREBASE_ADMIN_INITIALIZED = 'true';
}

const db = getFirestore();
const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from ZhenGrowth Cloud Run Backend!' });
});

/**
 * Telemetry log endpoint for sendBeacon fallback
 * Used when page unloads and Firebase callable can't be used
 */
app.post('/api/telemetry/log', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ ok: false, error: 'Events array required' });
    }

    if (events.length === 0) {
      return res.json({ ok: true, logged: 0 });
    }

    const batch = db.batch();
    const eventsCollection = db.collection('analytics_events');

    for (const event of events) {
      const docRef = eventsCollection.doc();
      batch.set(docRef, {
        event_name: event.name,
        properties: event.payload || {},
        session_id: event.sessionId || null,
        user_id: null, // No auth context in sendBeacon
        route: event.route || null,
        referrer: event.referrer || null,
        device: event.device || null,
        lang: event.lang || null,
        utm: event.utm || null,
        client_ts: event.ts || null,
        source: 'sendbeacon',
        created_at: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    res.json({ ok: true, logged: events.length });
  } catch (error) {
    console.error('[api/telemetry/log] Error:', error);
    res.status(500).json({ ok: false, error: 'Failed to log events' });
  }
});

/**
 * PWA telemetry endpoint
 * Used by PWA screens for analytics
 */
app.post('/api/pwa-telemetry', async (req, res) => {
  try {
    const { device_id, event, payload } = req.body;
    
    if (!event) {
      return res.status(400).json({ ok: false, error: 'Event name required' });
    }

    await db.collection('analytics_events').add({
      event_name: event,
      properties: { ...payload, device_id },
      source: 'pwa',
      created_at: FieldValue.serverTimestamp(),
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('[api/pwa-telemetry] Error:', error);
    res.status(500).json({ ok: false, error: 'Failed to log event' });
  }
});

/**
 * PWA boot endpoint
 * Returns configuration and hero content for PWA
 */
app.post('/api/pwa-boot', async (req, res) => {
  try {
    const { device, lang } = req.body;
    const acceptLang = req.headers['accept-language'] || 'en';
    
    // Get hero content from Firestore
    let hero = null;
    try {
      const heroDoc = await db.collection('config').doc('pwa_hero').get();
      if (heroDoc.exists) {
        hero = heroDoc.data();
      }
    } catch (e) {
      console.warn('Failed to get PWA hero config:', e);
    }

    // Default hero content
    if (!hero) {
      hero = {
        title_en: 'Grow with Clarity',
        title_zh_cn: '清晰成长',
        title_zh_tw: '清晰成長',
        subtitle_en: 'Life & career coaching for Chinese-speaking professionals',
        subtitle_zh_cn: '为华人专业人士提供生活与职业指导',
        subtitle_zh_tw: '為華人專業人士提供生活與職業指導'
      };
    }

    res.json({
      ok: true,
      hero,
      device,
      lang: lang || acceptLang,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[api/pwa-boot] Error:', error);
    res.status(500).json({ ok: false, error: 'Failed to boot' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
