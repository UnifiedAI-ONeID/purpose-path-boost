import { runMigration, MigrationConfig } from '../lib/core';

const migrateEventTypes: MigrationConfig<any> = {
  entity: 'calendar_types',
  sourceTable: 'cal_event_types',
  transform: async (row: any) => {
    return {
      path: `config/calendar/types/${row.id}`,
      data: {
        name: row.name,
        slug: row.slug,
        duration: row.duration,
        description: row.description,
        active: row.active,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateBookings: MigrationConfig<any> = {
  entity: 'bookings',
  sourceTable: 'cal_bookings',
  transform: async (row: any) => {
    return {
      path: `bookings/${row.id}`,
      data: {
        userId: row.user_id,
        typeId: row.event_type_id ? row.event_type_id.toString() : null,
        startTime: row.start_time ? new Date(row.start_time) : null,
        endTime: row.end_time ? new Date(row.end_time) : null,
        status: row.status,
        meetingUrl: row.meeting_url,
        rescheduleUrl: row.reschedule_url,
        guestEmail: row.guest_email,
        guestName: row.guest_name,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

async function run() {
  await runMigration(migrateEventTypes);
  await runMigration(migrateBookings);
}

run().catch(console.error);
