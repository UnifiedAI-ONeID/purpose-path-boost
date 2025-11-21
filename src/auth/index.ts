
import { auth as firebaseAuth } from '../firebase/config';
import { supabase } from '../integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User as FirebaseUser } from 'firebase/auth';

const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';

type AppUser = SupabaseUser | FirebaseUser;

let authClient: any;

if (authProvider === 'firebase') {
  authClient = firebaseAuth;
} else {
  authClient = supabase.auth;
}

export { authClient, AppUser };
