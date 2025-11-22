import { db, auth, functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

// ADAPTER: Supabase -> Firebase
// This file exists to allow legacy code to compile while migrating to Firebase.
// It maps Supabase client calls to Firebase equivalents where possible.

export const supabase = {
  functions: {
    invoke: async (name: string, options?: any) => {
      // console.log(`[Adapter] invoking ${name} via Firebase Functions`);
      try {
        const fn = httpsCallable(functions, name);
        // Supabase passes body in options.body
        const payload = options?.body || {};
        const result = await fn(payload);
        return { data: result.data, error: null };
      } catch (e: any) {
        console.error(`[Adapter] Error invoking ${name}:`, e);
        return { data: null, error: e };
      }
    }
  },
  auth: {
    getSession: async () => {
      const user = auth.currentUser;
      return { 
        data: { 
          session: user ? { access_token: 'mock-token', user: { id: user.uid, email: user.email } } : null 
        }, 
        error: null 
      };
    },
    getUser: async () => {
       const user = auth.currentUser;
       return { data: { user: user ? { id: user.uid, email: user.email } : null }, error: null };
    },
    onAuthStateChange: (cb: any) => {
        // Warning: accessing this likely means the component won't update on auth state change correctly
        return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => {
        await auth.signOut();
        return { error: null };
    }
  },
  // Database Shim - Legacy calls log warning
  from: (table: string) => {
      console.warn(`[Adapter] .from('${table}') called. Legacy Supabase DB call. Refactor to Firestore.`);
      return {
          select: () => ({ 
              eq: () => ({ 
                  maybeSingle: async () => ({ data: null, error: null }), 
                  single: async () => ({ data: null, error: null }),
                  order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) 
              }),
              order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
              limit: () => Promise.resolve({ data: [], error: null })
          }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
          upsert: async () => ({ data: null, error: null }),
      }
  },
  storage: {
      from: (bucket: string) => ({
          upload: async () => {
              console.error(`[Adapter] Storage upload to '${bucket}' not implemented.`);
              return { error: { message: "Storage not migrated" } };
          },
          getPublicUrl: () => ({ data: { publicUrl: "" } })
      })
  },
  rpc: async (name: string, params?: any) => {
      console.warn(`[Adapter] .rpc('${name}') called. Legacy RPC. Refactor to Callable.`);
      return { data: null, error: null };
  },
  channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {}
  }),
  removeChannel: () => {}
};

export const dbClient = supabase;
