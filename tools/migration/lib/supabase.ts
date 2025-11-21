import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in env.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
