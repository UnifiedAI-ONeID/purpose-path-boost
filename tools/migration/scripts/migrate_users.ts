import { runMigration, MigrationConfig } from '../lib/core';
import { supabase } from '../lib/supabase';

async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error || !data) return [];
  return data.map((r: any) => r.role);
}

const config: MigrationConfig<any> = {
  entity: 'users',
  sourceTable: 'zg_profiles',
  // targetCollection: 'users', // Removed
  orderBy: 'id',
  transform: async (row: any) => {
    if (!row.id) return null;

    const roles = await getUserRoles(row.id);

    return {
      path: `users/${row.id}`,
      data: {
        uid: row.id,
        email: row.email,
        displayName: row.full_name || row.display_name,
        photoURL: row.avatar_url,
        roles: roles.length > 0 ? roles : ['client'],
        createdAt: row.created_at,
        preferences: {
          language: row.language || 'en',
          timezone: row.timezone || 'UTC'
        },
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

runMigration(config).catch(console.error);
