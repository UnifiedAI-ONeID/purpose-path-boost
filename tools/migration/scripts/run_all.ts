import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const scripts = [
  'scripts/migrate_users.ts',
  'scripts/migrate_user_data.ts',
  'scripts/migrate_events.ts',
  'scripts/migrate_content.ts',
  'scripts/migrate_bookings.ts',
  'scripts/migrate_leads.ts',
  'scripts/migrate_commerce.ts'
];

async function runAll() {
  console.log('Starting full migration...');

  for (const script of scripts) {
    console.log(`\n--- Running ${script} ---`);
    try {
      const { stdout, stderr } = await execAsync(`npx ts-node ${script}`);
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error(`Failed to run ${script}:`, error);
      process.exit(1);
    }
  }

  console.log('\nAll migrations completed successfully.');
}

runAll().catch(console.error);
