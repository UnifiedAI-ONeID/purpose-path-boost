import { runMigration, MigrationConfig } from '../lib/core';
import { supabase } from '../lib/supabase';

async function getFunnelStages(funnelId: string) {
  const { data } = await supabase
    .from('funnel_stages')
    .select('*')
    .eq('funnel_id', funnelId)
    .order('order_index', { ascending: true });
  return data || [];
}

const migrateFunnels: MigrationConfig<any> = {
  entity: 'funnels',
  sourceTable: 'funnels',
  transform: async (row: any) => {
    const stages = await getFunnelStages(row.id);
    
    return {
      path: `config/funnels/${row.id}`,
      data: {
        name: row.name,
        slug: row.slug,
        trigger: row.trigger,
        active: row.active,
        stages: stages.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          config: s.config,
          orderIndex: s.order_index
        })),
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateLeads: MigrationConfig<any> = {
  entity: 'leads',
  sourceTable: 'leads',
  transform: async (row: any) => {
    return {
      path: `leads/${row.id}`,
      data: {
        email: row.email,
        source: row.source,
        status: row.status,
        tags: row.tags || [],
        name: row.name,
        phone: row.phone,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateReferrals: MigrationConfig<any> = {
  entity: 'referrals',
  sourceTable: 'zg_referrals',
  transform: async (row: any) => {
    return {
      path: `referrals/${row.id}`,
      data: {
        referrerId: row.referrer_id,
        refereeEmail: row.referee_email,
        status: row.status,
        code: row.code,
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
  await runMigration(migrateFunnels);
  await runMigration(migrateLeads);
  await runMigration(migrateReferrals);
}

run().catch(console.error);
