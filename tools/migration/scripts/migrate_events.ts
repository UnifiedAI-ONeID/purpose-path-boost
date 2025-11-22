import { runMigration, MigrationConfig } from '../lib/core';

const migrateEvents: MigrationConfig<any> = {
  entity: 'events',
  sourceTable: 'events',
  transform: async (row: any) => {
    return {
      path: `events/${row.id}`,
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
        slug: row.slug,
        startTime: row.start_ts ? new Date(row.start_ts) : null,
        endTime: row.end_ts ? new Date(row.end_ts) : null,
        location: row.location,
        published: row.published || false,
        pricing: row.pricing,
        images: row.images || [],
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateEventRegistrations: MigrationConfig<any> = {
  entity: 'event_registrations',
  sourceTable: 'event_regs', // Assuming event_regs is the table name
  transform: async (row: any) => {
    if (!row.event_id || !row.user_id) return null;
    
    return {
      path: `events/${row.event_id}/registrations/${row.id}`,
      data: {
        userId: row.user_id,
        status: row.status,
        ticketType: row.ticket_type,
        pricePaid: row.price_paid || 0,
        currency: row.currency || 'USD',
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
  await runMigration(migrateEvents);
  await runMigration(migrateEventRegistrations);
}

run().catch(console.error);
