import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
// In Cloud Run, we can use applicationDefault() or just initializeApp() with no args if using default credentials
if (!process.env.FIREBASE_ADMIN_INITIALIZED) {
  initializeApp();
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
