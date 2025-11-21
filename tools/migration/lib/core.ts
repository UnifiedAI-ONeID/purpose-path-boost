import { supabase } from './supabase';
import { db, firestore } from './firebase';

interface MigrationState {
  lastId: string | null;
  lastProcessedAt: string | null;
  totalProcessed: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
}

const BATCH_SIZE = 100;

export async function fetchInBatches(
  tableName: string,
  lastId: string | null,
  orderBy: string = 'id'
) {
  let query = supabase
    .from(tableName)
    .select('*')
    .order(orderBy, { ascending: true })
    .limit(BATCH_SIZE);

  if (lastId) {
    query = query.gt(orderBy, lastId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function writeBatchDocs(
  docs: { path: string; data: any }[],
  merge: boolean = true
) {
  const batch = db.batch();
  let count = 0;

  for (const doc of docs) {
    const docRef = db.doc(doc.path);
    const cleanData = JSON.parse(JSON.stringify(doc.data));
    batch.set(docRef, cleanData, { merge });
    count++;
  }

  await batch.commit();
  return count;
}

export async function getMigrationState(entity: string): Promise<MigrationState> {
  const doc = await db.collection('migrations').doc(`status_${entity}`).get();
  if (doc.exists) {
    return doc.data() as MigrationState;
  }
  return {
    lastId: null,
    lastProcessedAt: null,
    totalProcessed: 0,
    status: 'running',
  };
}

export async function updateMigrationState(
  entity: string,
  state: Partial<MigrationState>
) {
  await db.collection('migrations').doc(`status_${entity}`).set(
    {
      ...state,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export interface MigrationConfig<T> {
  entity: string;
  sourceTable: string;
  // targetCollection removed, transform now returns path
  transform: (row: any) => Promise<{ path: string; data: any } | null>;
  orderBy?: string;
}

export async function runMigration<T>(config: MigrationConfig<T>) {
  console.log(`Starting migration for ${config.entity}...`);
  
  let state = await getMigrationState(config.entity);
  if (state.status === 'completed') {
    console.log(`Migration for ${config.entity} already completed.`);
  }

  let lastId = state.lastId;
  let total = state.totalProcessed;
  let hasMore = true;

  while (hasMore) {
    try {
      const rows = await fetchInBatches(config.sourceTable, lastId, config.orderBy);
      
      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      const transformPromises = rows.map(row => config.transform(row));
      const results = await Promise.all(transformPromises);
      
      const transformedDocs = results.filter(doc => doc !== null) as { path: string; data: any }[];

      if (transformedDocs.length > 0) {
        await writeBatchDocs(transformedDocs);
      }

      lastId = rows[rows.length - 1][config.orderBy || 'id'];
      total += rows.length;

      await updateMigrationState(config.entity, {
        lastId,
        totalProcessed: total,
        status: 'running',
        lastProcessedAt: new Date().toISOString()
      });

      console.log(`Processed ${rows.length} rows. Total: ${total}`);

    } catch (error: any) {
      console.error(`Error migrating ${config.entity}:`, error);
      await updateMigrationState(config.entity, {
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  await updateMigrationState(config.entity, {
    status: 'completed',
    lastId: null
  });

  console.log(`Migration for ${config.entity} completed successfully.`);
}
