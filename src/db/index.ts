
import { createClient } from '@supabase/supabase-js';
import { db as firestoreDb } from '../firebase/config';

const dbProvider = import.meta.env.VITE_DB_PROVIDER || 'supabase';

let dbClient: any;

if (dbProvider === 'firebase') {
  dbClient = {
    // Add Firestore-specific methods here
  };
} else {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;
  dbClient = createClient(supabaseUrl, supabaseKey);
}

export { dbClient };
