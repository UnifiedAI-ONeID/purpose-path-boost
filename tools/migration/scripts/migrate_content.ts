import { runMigration, MigrationConfig } from '../lib/core';

const migrateLessons: MigrationConfig<any> = {
  entity: 'lessons',
  sourceTable: 'lessons',
  transform: async (row: any) => {
    const id = row.id || row.slug;
    return {
      path: `lessons/${id}`,
      data: {
        slug: row.slug,
        title: {
          en: row.title_en || row.title,
          zh: row.title_zh,
          tw: row.title_tw
        },
        summary: {
          en: row.summary_en || row.summary,
          zh: row.summary_zh,
          tw: row.summary_tw
        },
        ytId: row.yt_id,
        durationSec: row.duration_sec,
        tags: row.tags || [],
        orderIndex: row.order_index,
        published: row.published || false,
        chapters: row.chapters || [],
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

const migrateBlogPosts: MigrationConfig<any> = {
  entity: 'blog_posts',
  sourceTable: 'blog_posts',
  transform: async (row: any) => {
    const id = row.slug || row.id;
    return {
      path: `blog_posts/${id}`,
      data: {
        slug: row.slug,
        title: {
          en: row.title_en || row.title,
          zh: row.title_zh,
          tw: row.title_tw
        },
        content: {
          en: row.content_en || row.body || row.content,
          zh: row.content_zh,
          tw: row.content_tw
        },
        excerpt: {
          en: row.excerpt_en || row.excerpt,
          zh: row.excerpt_zh,
          tw: row.excerpt_tw
        },
        authorId: row.author_id,
        publishedAt: row.published_at ? new Date(row.published_at) : null,
        tags: row.tags || [],
        image: row.image || row.cover_image,
        metadata: {
          migrationSource: 'supabase',
          originalId: row.id
        }
      }
    };
  }
};

async function run() {
  await runMigration(migrateLessons);
  await runMigration(migrateBlogPosts);
}

run().catch(console.error);
