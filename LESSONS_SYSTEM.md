# Video Lessons System

## Overview

ZhenGrowth now includes a comprehensive video lessons system that allows you to deliver educational content to users with progress tracking, analytics, and smart recommendations based on their goals and quiz results.

## Architecture

### Database Tables

#### 1. `lessons`
The main catalog of video lessons.

**Columns**:
- `id` - Unique identifier
- `slug` - URL-friendly identifier (unique)
- `title_en` - Lesson title
- `summary_en` - Short description
- `yt_id` - YouTube video ID
- `duration_sec` - Video duration in seconds
- `tags` - Array of tags for categorization
- `order_index` - Display order
- `published` - Visibility flag
- `poster_url` - Custom thumbnail (optional)
- `cn_alt_url` - China-safe alternative (Bilibili, self-hosted, etc.)
- `captions_vtt_url` - Subtitles file URL

#### 2. `lesson_assignments`
Links lessons to coaching offers or user tags.

**Columns**:
- `offer_slug` - Links to `coaching_offers.slug`
- `tag` - User tag from quiz/goals
- `lesson_slug` - References `lessons.slug`
- `order_index` - Display order within assignment

#### 3. `lesson_progress`
Tracks individual user progress through lessons.

**Columns**:
- `profile_id` - User identifier
- `lesson_slug` - Lesson being watched
- `watched_seconds` - Total time watched
- `completed` - Completion flag
- `last_position_sec` - Resume position
- `last_watched_at` - Last view timestamp

#### 4. `lesson_events`
Analytics events for viewing behavior.

**Events tracked**:
- `start` - Video started
- `25%`, `50%`, `75%` - Milestone markers
- `complete` - Video completed
- `cta_book` - Booking CTA clicked
- `cta_reflect` - Reflection prompt engaged

## API Endpoints

### `/api/lessons/for-user`
Fetches lessons for a specific user with progress.

**Query Parameters**:
- `profile_id` (required) - User profile ID
- `tags` (optional) - Comma-separated tags for filtering

**Response**:
```json
{
  "ok": true,
  "rows": [
    {
      "slug": "clarity-basics-01",
      "title_en": "Finding Your Direction",
      "summary_en": "Learn how to identify your core values",
      "yt_id": "abc123",
      "duration_sec": 420,
      "poster_url": "...",
      "progress": {
        "completed": false,
        "last_position_sec": 120,
        "watched_seconds": 180
      }
    }
  ]
}
```

### `/api/lessons/get`
Fetches a single lesson by slug.

**Query Parameters**:
- `slug` (required) - Lesson slug

**Response**:
```json
{
  "ok": true,
  "lesson": {
    "slug": "clarity-basics-01",
    "title_en": "Finding Your Direction",
    // ... full lesson data
  }
}
```

### `/api/lessons/progress`
Updates user progress for a lesson.

**Method**: POST

**Body**:
```json
{
  "profile_id": "uuid",
  "lesson_slug": "clarity-basics-01",
  "at_sec": 120,
  "duration_sec": 420,
  "completed": false
}
```

### `/api/lessons/event`
Logs viewing analytics events.

**Method**: POST

**Body**:
```json
{
  "profile_id": "uuid",
  "lesson_slug": "clarity-basics-01",
  "ev": "25%",
  "at_sec": 105
}
```

## React Components

### `<LessonStrip>`
Displays a curated strip of lessons with featured "next up" lesson.

**Props**:
```typescript
interface LessonStripProps {
  profileId: string;
  tags?: string[];
}
```

**Features**:
- Highlights next incomplete lesson
- Shows progress bars
- Grid layout for quick access
- Modal video player

**Usage**:
```tsx
import { LessonStrip } from '@/components/LessonStrip';

<LessonStrip 
  profileId={user.profile_id} 
  tags={['clarity', 'career']} 
/>
```

### `<LessonPlayerLite>`
Lightweight video player with progress tracking.

**Props**:
```typescript
interface LessonPlayerLiteProps {
  profileId: string;
  slug: string;
  onClose: () => void;
}
```

**Features**:
- YouTube embed (global)
- Alternative video source (China)
- Automatic progress tracking
- Milestone event logging (25%, 50%, 75%, complete)
- CTAs for booking sessions
- Resume functionality

## Integration Guide

### 1. Adding Lessons

Use the Supabase dashboard to insert lessons:

```sql
INSERT INTO lessons (slug, title_en, summary_en, yt_id, duration_sec, tags, order_index, published)
VALUES (
  'clarity-basics-01',
  'Finding Your Direction',
  'Learn how to identify your core values and life direction',
  'dQw4w9WgXcQ',
  420,
  ARRAY['clarity', 'self-discovery'],
  1,
  true
);
```

### 2. Creating Assignments

Link lessons to user segments:

```sql
-- Assign to all "clarity" quiz takers
INSERT INTO lesson_assignments (tag, lesson_slug, order_index)
VALUES ('clarity', 'clarity-basics-01', 1);

-- Assign to specific coaching offer
INSERT INTO lesson_assignments (offer_slug, lesson_slug, order_index)
VALUES ('career-clarity', 'clarity-basics-01', 1);
```

### 3. Adding to Dashboard

In your user dashboard component:

```tsx
import { LessonStrip } from '@/components/LessonStrip';

function Dashboard({ user }) {
  return (
    <div>
      {/* ... other dashboard content */}
      
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Video Lessons</h2>
          <SmartLink to="/resources?type=lessons">
            <Button variant="ghost">View all</Button>
          </SmartLink>
        </div>
        
        <LessonStrip 
          profileId={user.profile_id} 
          tags={user.tags || []} 
        />
      </section>
    </div>
  );
}
```

### 4. China Support

For China users, provide alternative video sources:

```sql
UPDATE lessons 
SET cn_alt_url = 'https://bilibili.com/video/BV1...'
WHERE slug = 'clarity-basics-01';
```

The player automatically detects user locale and switches sources.

## Analytics & Insights

### Progress Tracking

Query user engagement:

```sql
-- Users who completed lessons
SELECT profile_id, COUNT(*) as completed_count
FROM lesson_progress
WHERE completed = true
GROUP BY profile_id
ORDER BY completed_count DESC;

-- Average completion rate
SELECT 
  lesson_slug,
  COUNT(*) FILTER (WHERE completed) * 100.0 / COUNT(*) as completion_rate
FROM lesson_progress
GROUP BY lesson_slug;
```

### Event Analytics

Track viewing patterns:

```sql
-- Milestone drop-off analysis
SELECT 
  ev,
  COUNT(*) as event_count
FROM lesson_events
WHERE lesson_slug = 'clarity-basics-01'
GROUP BY ev
ORDER BY 
  CASE ev
    WHEN 'start' THEN 1
    WHEN '25%' THEN 2
    WHEN '50%' THEN 3
    WHEN '75%' THEN 4
    WHEN 'complete' THEN 5
  END;
```

## Best Practices

### 1. Video Duration
- Keep lessons under 10 minutes for better completion rates
- Break longer content into series

### 2. Thumbnails
- Use custom `poster_url` for consistent branding
- 16:9 aspect ratio, minimum 1280x720px

### 3. Tagging
- Use consistent tag vocabulary
- Match tags to quiz result categories
- Enable smart recommendations

### 4. CTAs
- Include booking CTAs at natural breakpoints
- Prompt reflection exercises
- Link to related coaching offers

### 5. Content Strategy
- Create lesson paths (beginner → advanced)
- Use assignments to guide users
- Update content based on analytics

## Troubleshooting

### Videos not loading
- Check `published` flag is true
- Verify `yt_id` is valid
- Ensure RLS policies allow access

### Progress not saving
- Confirm `profile_id` is correct
- Check browser console for errors
- Verify API endpoint is accessible

### China users see wrong video
- Set `cn_alt_url` for all lessons
- Test with `navigator.language = 'zh-CN'`
- Consider using Cloudflare Stream

## Future Enhancements

- [ ] Lesson quizzes and assessments
- [ ] Certificate generation on completion
- [ ] Social sharing of progress
- [ ] Lesson playlists and learning paths
- [ ] Live lesson streaming
- [ ] Interactive transcripts with search
- [ ] Video speed controls
- [ ] Notes and bookmarks
- [ ] Peer discussion threads
- [ ] Mobile app with offline playback
