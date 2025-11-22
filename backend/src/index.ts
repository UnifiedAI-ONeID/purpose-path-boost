import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
