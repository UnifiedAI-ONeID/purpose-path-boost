import { runMigration, MigrationConfig } from '../lib/core';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

const config: MigrationConfig<any> = {
  entity: 'auth_users',
  sourceTable: 'zg_profiles',
  orderBy: 'id',
  transform: async (row: any) => {
    if (!row.id || !row.email) return null;

    try {
      // Check if user exists
      try {
        await auth.getUser(row.id);
        // User exists, maybe update?
        return null; // Skip existing
      } catch (e: any) {
        if (e.code !== 'auth/user-not-found') {
          throw e;
        }
      }

      // Create user
      await auth.createUser({
        uid: row.id,
        email: row.email,
        emailVerified: true, // Assume verified if coming from existing system
        displayName: row.full_name || row.display_name,
        photoURL: row.avatar_url,
      });

      return null; // No Firestore write needed here, handled by migrate_users.ts
    } catch (error) {
      console.error(`Failed to create auth user ${row.id}:`, error);
      return null;
    }
  }
};

runMigration(config).catch(console.error);
