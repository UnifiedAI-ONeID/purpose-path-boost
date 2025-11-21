import { runMigration, MigrationConfig } from '../lib/core';

const migrateGoals: MigrationConfig<any> = {
  entity: 'user_goals',
  sourceTable: 'me_goals',
  transform: async (row: any) => {
    return {
      path: `users/${row.user_id}/goals/${row.id}`,
      data: {
        title: row.title,
        status: row.status, // active, completed
        deadline: row.deadline ? new Date(row.deadline) : null,
        progress: row.progress || 0,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateSessions: MigrationConfig<any> = {
  entity: 'user_sessions',
  sourceTable: 'me_sessions',
  transform: async (row: any) => {
    return {
      path: `users/${row.user_id}/sessions/${row.id}`,
      data: {
        date: row.session_date ? new Date(row.session_date) : null,
        notes: row.notes,
        actionItems: row.action_items || [],
        coachId: row.coach_id,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateReceipts: MigrationConfig<any> = {
  entity: 'user_receipts',
  sourceTable: 'me_receipts',
  transform: async (row: any) => {
    return {
      path: `users/${row.user_id}/receipts/${row.id}`,
      data: {
        amount: row.amount,
        currency: row.currency,
        url: row.receipt_url,
        date: row.created_at ? new Date(row.created_at) : null,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateNotifications: MigrationConfig<any> = {
  entity: 'user_notifications',
  sourceTable: 'nudge_inbox',
  transform: async (row: any) => {
    return {
      path: `users/${row.user_id}/notifications/${row.id}`,
      data: {
        message: row.message,
        read: row.read || false,
        type: row.type,
        actionUrl: row.action_url,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

async function run() {
  await runMigration(migrateGoals);
  await runMigration(migrateSessions);
  await runMigration(migrateReceipts);
  await runMigration(migrateNotifications);
}

run().catch(console.error);
