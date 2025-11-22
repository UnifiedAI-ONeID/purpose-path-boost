import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../../src/lib/firebase-admin'; // You'll need a server-side admin init
import { WriteBatch } from 'firebase-admin/firestore';

// NOTE: You must set up 'firebase-admin' service account credentials 
// in your environment for this to work locally.

async function importUsers() {
  const csvPath = path.join(__dirname, '../import_templates/users_template.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Users CSV not found:', csvPath);
    return;
  }

  console.log(`Reading users from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Found ${records.length} users. Starting import...`);

  // Batch writes (limit 500 per batch)
  const batchSize = 400; 
  let batch = db.batch();
  let count = 0;
  let total = 0;

  for (const row of records) {
    // Map CSV columns to Firestore schema
    const uid = row.uid;
    if (!uid) {
      console.warn('Skipping row without uid:', row);
      continue;
    }

    const userRef = db.collection('users').doc(uid);
    
    const userData = {
      uid: row.uid,
      email: row.email || '',
      displayName: row.displayName || '',
      roles: row.role ? [row.role] : ['client'],
      createdAt: row.createdAt || new Date().toISOString(),
      metadata: {
        importedAt: new Date().toISOString(),
        source: 'csv_import'
      }
    };

    batch.set(userRef, userData, { merge: true });
    count++;
    total++;

    if (count >= batchSize) {
      await batch.commit();
      console.log(`Committed ${count} users...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Committed final ${count} users.`);
  }

  console.log(`✅ Import complete. Total users: ${total}`);
}

importUsers().catch(console.error);
