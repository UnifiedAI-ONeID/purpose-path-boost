import { runMigration, MigrationConfig } from '../lib/core';

const migrateOffers: MigrationConfig<any> = {
  entity: 'coaching_offers',
  sourceTable: 'coaching_offers',
  transform: async (row: any) => {
    return {
      path: `coaching_offers/${row.id}`,
      data: {
        title: {
          en: row.title_en || row.title,
          zh: row.title_zh,
          tw: row.title_tw
        },
        description: {
          en: row.description_en || row.description,
          zh: row.description_zh,
          tw: row.description_tw
        },
        price: row.price,
        currency: row.currency || 'USD',
        features: row.features || [],
        active: row.active,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateOrders: MigrationConfig<any> = {
  entity: 'orders',
  sourceTable: 'express_orders',
  transform: async (row: any) => {
    return {
      path: `orders/${row.id}`,
      data: {
        userId: row.user_id,
        amount: row.amount,
        currency: row.currency,
        items: row.items || [],
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        providerId: row.stripe_id || row.provider_id,
        customerDetails: {
          email: row.customer_email,
          name: row.customer_name
        },
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

async function run() {
  await runMigration(migrateOffers);
  await runMigration(migrateOrders);
}

run().catch(console.error);
