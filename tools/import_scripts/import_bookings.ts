import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../../src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

async function importBookings() {
  const csvPath = path.join(__dirname, '../import_templates/bookings_template.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Bookings CSV not found:', csvPath);
    return;
  }

  console.log(`Reading bookings from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Found ${records.length} bookings. Starting import...`);

  const batchSize = 400;
  let batch = db.batch();
  let count = 0;
  let total = 0;

  for (const row of records) {
    const bookingId = row.bookingId;
    if (!bookingId) continue;

    const bookingRef = db.collection('bookings').doc(bookingId);

    // Parse dates
    const start = row.startTime ? new Date(row.startTime) : new Date();
    const end = row.endTime ? new Date(row.endTime) : new Date(start.getTime() + 3600000);

    const bookingData = {
      userId: row.userId,
      eventTypeId: row.eventTypeId,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      status: row.status || 'confirmed',
      guestEmail: row.guestEmail || null,
      createdAt: Timestamp.now(),
      metadata: {
        importedAt: new Date().toISOString()
      }
    };

    batch.set(bookingRef, bookingData, { merge: true });
    count++;
    total++;

    if (count >= batchSize) {
      await batch.commit();
      console.log(`Committed ${count} bookings...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Committed final ${count} bookings.`);
  }

  console.log(`✅ Bookings import complete. Total: ${total}`);
}

importBookings().catch(console.error);
