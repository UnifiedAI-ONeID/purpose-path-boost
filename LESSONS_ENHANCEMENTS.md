# Video Lessons - New Enhancements

## Overview

The video lessons system has been significantly enhanced with precise tracking, chapter navigation, and continue watching functionality.

## Key Features

### 1. YouTube IFrame API Integration

**Benefits**:
- ✅ **Precise time tracking** - Exact second-by-second progress
- ✅ **Accurate resume** - Pick up exactly where you left off
- ✅ **Real-time updates** - No polling needed
- ✅ **Better UX** - Smooth playback controls

**Implementation**:
- Uses official YouTube IFrame API (`/src/lib/youtubeApi.ts`)
- Lazy loads API script on demand
- Tracks play/pause/end states
- Auto-saves progress on pause/end

### 2. Chapter Navigation

**Database Structure**:
```sql
-- Add chapters to lesson
UPDATE lessons 
SET chapters = '[
  {"t": 0, "label": "Introduction"},
  {"t": 62, "label": "Core Framework"},
  {"t": 180, "label": "Real Examples"},
  {"t": 320, "label": "Action Steps"}
]'::jsonb
WHERE slug = 'clarity-basics-01';
```

**UI Features**:
- Clickable chapter buttons in player
- Formatted timestamps (MM:SS)
- Grid layout for easy scanning
- Tracks chapter clicks as events

### 3. Continue Watching Bar

**Features**:
- Shows most recently watched incomplete lesson
- Displays progress percentage
- Thumbnail with progress overlay
- One-click resume
- Auto-hides when no lessons in progress

**API Endpoint**: `/api/lessons/continue`
- Queries most recent incomplete lesson
- Optimized with database index
- Returns lesson + progress data

**Performance**:
```sql
CREATE INDEX lesson_progress_recent_idx
ON lesson_progress (profile_id, completed, last_watched_at DESC);
```

### 4. Global Lesson Events

**Trigger from anywhere**:
```tsx
// Open lesson player from CTA, email, notification, etc.
document.dispatchEvent(new CustomEvent('zg:openLesson', {
  detail: { slug: 'clarity-basics-01' }
}));
```

**Listen in dashboard**:
```tsx
useEffect(() => {
  function handleOpenLesson(e: any) {
    setOpenLessonSlug(e.detail?.slug);
  }
  
  document.addEventListener('zg:openLesson', handleOpenLesson);
  return () => document.removeEventListener('zg:openLesson', handleOpenLesson);
}, []);
```

## Components

### `<LessonPlayerYT>`
Enhanced player with YouTube API integration.

**Key improvements over LessonPlayerLite**:
- Precise time tracking (to the second)
- Chapter navigation UI
- Better progress saving (on pause/end)
- Milestone detection without polling
- Event analytics for chapters

**Props**:
```typescript
interface LessonPlayerYTProps {
  profileId: string;
  slug: string;
  onClose: () => void;
}
```

### `<ContinueWatchingBar>`
Prominent resume prompt.

**Props**:
```typescript
interface ContinueWatchingBarProps {
  profileId: string;
  onOpenLesson: (slug: string) => void;
}
```

## API Changes

### Updated: `/api/lessons/get`

**New**: Now accepts `profile_id` query param

**Before**:
```
GET /api/lessons/get?slug=clarity-basics-01
```

**After**:
```
GET /api/lessons/get?slug=clarity-basics-01&profile_id=uuid
```

**Response includes progress**:
```json
{
  "ok": true,
  "lesson": { /* lesson data */ },
  "progress": {
    "last_position_sec": 120,
    "completed": false,
    "watched_seconds": 180
  }
}
```

### New: `/api/lessons/continue`

Fetches most recent incomplete lesson.

**Request**:
```
GET /api/lessons/continue?profile_id=uuid
```

**Response**:
```json
{
  "ok": true,
  "item": {
    "slug": "clarity-basics-01",
    "title_en": "Finding Your Direction",
    "poster_url": "...",
    "duration_sec": 420,
    "last_position_sec": 120
  }
}
```

## Integration Example

```tsx
import { ContinueWatchingBar } from '@/components/ContinueWatchingBar';
import { LessonStrip } from '@/components/LessonStrip';
import { LessonPlayerYT } from '@/components/LessonPlayerYT';

function Dashboard({ user }) {
  const [openLessonSlug, setOpenLessonSlug] = useState<string | null>(null);
  
  // Listen for global lesson open events
  useEffect(() => {
    function handleOpenLesson(e: any) {
      setOpenLessonSlug(e.detail?.slug);
    }
    
    document.addEventListener('zg:openLesson', handleOpenLesson);
    return () => document.removeEventListener('zg:openLesson', handleOpenLesson);
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Continue watching - appears only if there's progress */}
      <ContinueWatchingBar 
        profileId={user.profile_id}
        onOpenLesson={setOpenLessonSlug}
      />
      
      {/* Lesson library */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Video Lessons</h2>
        <LessonStrip 
          profileId={user.profile_id} 
          tags={user.tags || []} 
        />
      </section>
      
      {/* Shared lesson player modal */}
      {openLessonSlug && (
        <div 
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4"
          onClick={() => setOpenLessonSlug(null)}
        >
          <div 
            className="bg-card rounded-2xl w-full max-w-4xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <LessonPlayerYT
              profileId={user.profile_id}
              slug={openLessonSlug}
              onClose={() => setOpenLessonSlug(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Analytics Events

New events tracked:
- `chapter_click` - User clicked chapter button
- `25%`, `50%`, `75%` - Milestone markers (precise)
- `complete` - Video ended
- `cta_book` - Booking CTA clicked

## Migration Guide

### From LessonPlayerLite to LessonPlayerYT

**Before**:
```tsx
import { LessonPlayerLite } from './LessonPlayerLite';

<LessonPlayerLite profileId={id} slug={slug} onClose={close} />
```

**After**:
```tsx
import { LessonPlayerYT } from './LessonPlayerYT';

<LessonPlayerYT profileId={id} slug={slug} onClose={close} />
```

No other changes needed - API is identical!

## Testing

### Adding test lesson with chapters

```sql
INSERT INTO lessons (
  slug, title_en, summary_en, yt_id, duration_sec, 
  tags, order_index, published, chapters
) VALUES (
  'test-lesson',
  'Test Lesson with Chapters',
  'A test lesson to verify chapter navigation',
  'dQw4w9WgXcQ',
  420,
  ARRAY['test'],
  1,
  true,
  '[
    {"t": 0, "label": "Start"},
    {"t": 30, "label": "Middle"},
    {"t": 60, "label": "End"}
  ]'::jsonb
);
```

### Testing continue watching

1. Start watching a lesson
2. Pause before completion
3. Navigate away
4. Return to dashboard
5. Should see "Continue watching" bar
6. Click "Resume"
7. Video should start at last position

## Performance

### Database Query Optimization

The continue watching query is optimized:

```sql
-- Uses index for fast lookup
SELECT lesson_slug, last_position_sec, last_watched_at
FROM lesson_progress
WHERE profile_id = ? AND completed = false
ORDER BY last_watched_at DESC
LIMIT 1;
```

### YouTube API Loading

API script is loaded once and cached:

```typescript
// First call loads script
await loadYouTubeAPI(); // ~500ms

// Subsequent calls return immediately
await loadYouTubeAPI(); // <1ms
```

## Troubleshooting

### YouTube player not loading
- Check console for YouTube API errors
- Verify `yt_id` is valid
- Test with `?enablejsapi=1` param

### Progress not resuming
- Check `last_position_sec` in database
- Verify `profile_id` is passed to API
- Ensure YouTube API has loaded

### Chapters not showing
- Verify `chapters` is valid JSONB
- Check timestamps are in seconds
- Ensure chapter labels are strings

## Future Enhancements

- [ ] Picture-in-picture mode
- [ ] Playback speed controls
- [ ] Keyboard shortcuts (space, arrows)
- [ ] Video quality selector
- [ ] Interactive transcripts
- [ ] Bookmarks/notes at timestamps
- [ ] Watch party (synchronized viewing)
- [ ] Offline download for mobile
