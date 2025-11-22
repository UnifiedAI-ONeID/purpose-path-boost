import { db } from '../firebase/config';
import { collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';

// Re-export Firestore functions to mimic Supabase client where possible, 
// or provide a clear migration path.
// This file serves as a temporary bridge.

// IMPORTANT: This is NOT a full Supabase client implementation. 
// It is a "Database Client" that points to Firebase.
// Any code importing 'supabase' from here needs to be refactored to use 'db' directly or these helpers.

export const dbClient = {
    // Legacy access (should be replaced)
    firestore: db,
    
    // Mock functions to catch remaining calls
    from: (collectionName: string) => {
        const msg = `[MIGRATION-WARNING] 'supabase.from("${collectionName}")' was called. This is a LEGACY call and will return empty data. Please refactor to use Firestore directly.`;
        console.warn(msg);
        
        return {
            select: async (...args: any[]) => { 
                console.error(`[MIGRATION-ACTION-REQUIRED] .select() called on '${collectionName}'. Returning []. Stack trace:`, new Error().stack);
                return { data: [], error: null }; 
            },
            insert: async (data: any) => { 
                console.error(`[MIGRATION-ACTION-REQUIRED] .insert() called on '${collectionName}'. Data NOT saved. Stack trace:`, new Error().stack);
                return { data: null, error: null }; 
            },
            update: async (data: any) => { 
                console.error(`[MIGRATION-ACTION-REQUIRED] .update() called on '${collectionName}'. Data NOT saved. Stack trace:`, new Error().stack);
                return { data: null, error: null }; 
            },
            delete: async () => { 
                console.error(`[MIGRATION-ACTION-REQUIRED] .delete() called on '${collectionName}'. Operation NOT performed. Stack trace:`, new Error().stack);
                return { data: null, error: null }; 
            },
            upsert: async (data: any) => { 
                console.error(`[MIGRATION-ACTION-REQUIRED] .upsert() called on '${collectionName}'. Data NOT saved. Stack trace:`, new Error().stack);
                return { data: null, error: null }; 
            },
            eq: function() { return this; },
            order: function() { return this; },
            limit: function() { return this; },
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null })
        };
    },
    
    // Mock functions interface
    functions: {
        invoke: async (functionName: string, options?: any) => {
            console.warn(`[MIGRATION-WARNING] supabase.functions.invoke('${functionName}') called. Refactor to use 'httpsCallable' from Firebase Functions.`);
            return { data: null, error: { message: "Migration needed: Function call intercepted" } };
        }
    },
    
    // Mock RPC
    rpc: async (funcName: string, params?: any) => {
         console.warn(`[MIGRATION-WARNING] supabase.rpc('${funcName}') called. Refactor to use Firebase Functions or Firestore queries.`);
         return { data: null, error: { message: "Migration needed: RPC call intercepted" } };
    },

    // Mock Auth (should use firebase.auth directly)
    auth: {
        getSession: async () => { 
            console.warn("[MIGRATION-WARNING] supabase.auth.getSession() called. Refactor to use 'auth.currentUser' from Firebase.");
            return { data: { session: null }, error: null };
        },
        getUser: async () => {
            console.warn("[MIGRATION-WARNING] supabase.auth.getUser() called. Refactor to use 'auth.currentUser' from Firebase.");
            return { data: { user: null }, error: null };
        },
        onAuthStateChange: () => {
            console.warn("[MIGRATION-WARNING] supabase.auth.onAuthStateChange() called. Refactor to use 'onAuthStateChanged' from Firebase.");
             return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signOut: async () => {
            console.warn("[MIGRATION-WARNING] supabase.auth.signOut() called. Refactor to use 'signOut(auth)' from Firebase.");
            return { error: null };
        }
    },
    
    // Mock Storage
    storage: {
        from: (bucket: string) => ({
            upload: async () => {
                console.error(`[MIGRATION-ACTION-REQUIRED] Storage upload to '${bucket}' intercepted. Refactor to Firebase Storage.`);
                return { error: { message: "Storage migration pending" } };
            },
            getPublicUrl: (path: string) => ({ data: { publicUrl: "" } })
        })
    },

    channel: (name: string) => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
    }),
    removeChannel: () => {}
};
