import { runMigration, MigrationConfig } from '../lib/core';

const config: MigrationConfig<any> = {
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

runMigration(config).catch(console.error);
