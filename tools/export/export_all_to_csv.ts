#!/usr/bin/env tsx
/**
 * Export all Supabase tables to CSV for Firebase migration
 * Usage: tsx tools/export/export_all_to_csv.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OUTPUT_DIR = path.join(process.cwd(), 'tools/export/csv_exports');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define all tables to export
const TABLES = [
  // User Management
  'zg_profiles',
  'user_roles',
  'user_badges',
  
  // Coaching & Bookings
  'coaching_offers',
  'cal_bookings',
  'cal_event_types',
  'me_sessions',
  'me_goals',
  'me_receipts',
  
  // Content
  'blog_posts',
  'blog_templates',
  'lessons',
  'lesson_progress',
  
  // E-Commerce
  'bookings',
  'express_orders',
  'payments',
  'coupons',
  
  // Events
  'events_catalog',
  'event_prices',
  'event_regs',
  
  // Marketing & Leads
  'leads',
  'funnels',
  'funnel_stages',
  'user_funnel_progress',
  'zg_referrals',
  
  // Analytics
  'analytics_events',
  'experiments',
  'experiment_assignments',
  
  // AI Features
  'ai_logs',
  'ai_suggestions_cache',
  
  // Community
  'community_posts',
  'community_comments',
  'community_reports',
  
  // Social Media
  'social_accounts',
  'social_posts',
  'social_analytics',
  
  // Configuration
  'remote_flags',
  'i18n_dict',
  'email_templates',
  'email_queue',
  'email_logs',
  'badges',
  'zg_versions',
  
  // Notifications
  'nudge_inbox',
  'push_subscriptions',
];

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

function convertToCsv(data: any[]): string {
  if (data.length === 0) {
    return '';
  }
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Build CSV
  const csvLines: string[] = [];
  
  // Header row
  csvLines.push(headers.map(escapeCsvValue).join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle special types
      if (typeof value === 'object' && value !== null) {
        // JSON stringify objects and arrays
        return escapeCsvValue(JSON.stringify(value));
      }
      
      return escapeCsvValue(value);
    });
    
    csvLines.push(values.join(','));
  }
  
  return csvLines.join('\n');
}

async function exportTable(tableName: string): Promise<void> {
  console.log(`\nExporting ${tableName}...`);
  
  try {
    // Fetch all data from table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error(`  ❌ Error fetching ${tableName}:`, error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`  ⚠️  ${tableName} is empty (0 rows)`);
      // Still create an empty file
      const filePath = path.join(OUTPUT_DIR, `${tableName}.csv`);
      fs.writeFileSync(filePath, '');
      return;
    }
    
    console.log(`  📊 Fetched ${data.length} rows (total: ${count || data.length})`);
    
    // Convert to CSV
    const csv = convertToCsv(data);
    
    // Write to file
    const filePath = path.join(OUTPUT_DIR, `${tableName}.csv`);
    fs.writeFileSync(filePath, csv, 'utf-8');
    
    console.log(`  ✅ Exported to ${tableName}.csv`);
    
  } catch (err: any) {
    console.error(`  ❌ Error exporting ${tableName}:`, err.message);
  }
}

async function exportAll() {
  console.log('🚀 Starting database export to CSV...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`📋 Tables to export: ${TABLES.length}`);
  
  const startTime = Date.now();
  
  // Export all tables
  for (const table of TABLES) {
    await exportTable(table);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✨ Export complete in ${duration}s`);
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
  
  // Create a summary file
  const summary = {
    exportDate: new Date().toISOString(),
    totalTables: TABLES.length,
    durationSeconds: duration,
    outputDirectory: OUTPUT_DIR,
    tables: TABLES,
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_export_summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n📄 Export summary saved to _export_summary.json');
}

// Run export
exportAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
