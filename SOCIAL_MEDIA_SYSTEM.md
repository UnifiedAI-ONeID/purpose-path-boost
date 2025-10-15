# Social Media Cross-Posting System

## Overview
Complete automated social media management system with AI-powered content suggestions, cross-platform posting, and analytics tracking.

## Features

### 1. Cross-Platform Posting
**Supported Platforms:**
- **Western Platforms:** LinkedIn, Facebook, Instagram, X (Twitter)
- **Chinese Platforms:** WeChat, RED (小红书), Zhihu (知乎), Douyin (抖音)

**Flow:**
1. Write/publish a blog post
2. Click "Share" button on published post
3. Select target platforms
4. System queues posts for each platform
5. Worker processes queue and publishes automatically

### 2. Analytics Collection
- Automatically collects metrics from all posted content
- Tracks: impressions, likes, comments, shares, saves, video views
- Visualizations with trend charts
- Platform-by-platform breakdown

### 3. AI Content Suggestions (Lovable AI)
- Analyzes past 90 days of performance
- Generates bilingual content ideas (English + Chinese)
- Suggests:
  - Blog/article titles optimized for platforms
  - Short-form video hooks for Reels/Shorts
  - Hashtags (mix of English and Chinese)
  - Optimal posting times for Asia/Vancouver timezones

### 4. Tag-Based Hashtag System
- **Intelligent Hashtag Selection:** Automatically includes relevant hashtags based on blog post tags
- **Tag Categories:** Each tag (mindset, confidence, clarity, etc.) has curated hashtag sets
- **Platform Optimization:** Respects platform-specific hashtag limits
  - Instagram: 15 hashtags
  - LinkedIn: 8 hashtags
  - X (Twitter): 6 hashtags
- **Bilingual Support:** Separate hashtag sets for English and Chinese content
- **Deduplication:** Automatically removes duplicate hashtags
- **Brand Consistency:** Includes core brand hashtags (LifeCoaching, ZhenGrowth, etc.)

## Architecture

### Edge Functions

#### `social-queue`
- **Purpose:** Queue posts for publishing
- **Auth:** Requires JWT (admin only)
- **Input:** `{ slug, title, summary, cover, platforms[] }`
- **Output:** Creates rows in `social_posts` table with status 'queued'

#### `social-worker`
- **Purpose:** Process queued posts and publish to platforms
- **Auth:** Public (can be triggered by cron or manually)
- **Flow:**
  1. Fetches queued posts
  2. For each platform, calls appropriate API
  3. Updates status to 'posted' or 'failed'
  4. Stores platform post IDs
- **Note:** Chinese platforms generate export ZIP for manual upload

#### `social-metrics-collect`
- **Purpose:** Fetch performance metrics from platforms
- **Auth:** Public (can be triggered by cron)
- **Flow:**
  1. Gets recently posted content
  2. Calls platform APIs for metrics
  3. Stores in `social_metrics` table
  4. Handles rate limits gracefully

#### `ai-suggest-topics`
- **Purpose:** Generate AI-powered content suggestions
- **Auth:** Public
- **Model:** google/gemini-2.5-flash (Lovable AI)
- **Input:** Analyzes past 90 days of metrics
- **Output:** Structured content suggestions

### Database Tables

#### `social_posts`
- Tracks all queued/posted content
- Columns: blog_slug, platform, status, message, media, platform_post_id, error
- Status: 'queued' → 'posted' or 'failed'

#### `social_metrics`
- Time-series metrics data
- Columns: platform, platform_post_id, captured_at, impressions, clicks, likes, comments, shares, saves, video_views, followers
- Enables trend analysis and AI optimization

#### `social_accounts`
- Platform account information
- Stores channel names and external IDs

### UI Components

#### `BlogComposer`
- Platform selection UI with emoji icons
- Queue posts for multiple platforms at once
- Shows info about Chinese platform export packs
- Triggers worker after queueing

#### `SocialAnalytics`
- Platform-by-platform metrics cards
- Mini line charts for trends
- Total impressions, engagements visualization

#### `ContentSuggestions`
- AI-powered content ideas generator
- Analyzes your performance data
- Bilingual suggestions (EN/CN)
- One-click generation

#### `AdminSecrets`
- Encrypted token management
- Required secrets:
  - `LINKEDIN_ACCESS_TOKEN`
  - `FACEBOOK_PAGE_ID`
  - `FACEBOOK_PAGE_ACCESS_TOKEN`
  - `INSTAGRAM_BUSINESS_ID`
  - `INSTAGRAM_GRAPH_TOKEN`
  - `X_BEARER_TOKEN`

## Usage Workflow

### Initial Setup
1. Go to Admin Dashboard → Secrets tab
2. Add API tokens for each platform you want to use
3. Tokens are encrypted with MASTER_KEY

### Publishing Content
1. Create and publish blog post
2. Click Share (📱) icon on published post
3. Select platforms (defaults: LinkedIn + Facebook)
4. Click "Share to X platforms"
5. Posts are queued

### Processing Queue
- **Automatic:** Worker can be triggered by cron
- **Manual:** Click "🚀 Dispatch Queued Posts" in Blog tab
- Worker publishes to all platforms
- View results in `social_posts` table

### Collecting Metrics
- **Manual:** Click "📊 Collect Metrics" button
- Fetches latest performance data from all platforms
- Updates `social_metrics` table
- Refresh page to see updated analytics

### Generating AI Suggestions
1. Navigate to Blog tab
2. Scroll to "AI Content Suggestions" section
3. Click "Generate Ideas"
4. AI analyzes your past 90 days
5. Provides tailored bilingual suggestions

### Using Tag-Based Hashtags
1. **Assign Tags to Blog Posts:** When creating a blog, add relevant tags (e.g., "confidence", "mindset")
2. **First Tag is Primary:** The system uses the first tag to select hashtag set
3. **Automatic Caption Generation:** When using CaptionBuilder, hashtags are auto-included
4. **Platform-Optimized:** Hashtags are limited per platform (Instagram: 15, LinkedIn: 8, X: 6)
5. **Tag Emoji Indicators:** CoverComposer shows tag emoji (🧠 for mindset, 💪 for confidence, etc.)

- **Tag Hashtag Reference:**
- **mindset** → #MindsetShift #SelfGrowth #PositiveThinking
- **confidence** → #Confidence #SelfWorth #OwnYourVoice
- **clarity** → #Clarity #LifeDesign #Vision
- **consistency** → #Consistency #DailyHabits #SmallWins
- **habits** → #AtomicHabits #Routine #Discipline
- **leadership** → #WomenInLeadership #Leadership #ExecutiveCoaching
- **career** → #CareerGrowth #CareerPivot #WorkSmarter
- **relationships** → #HealthyBoundaries #Communication #Empathy
- **wellness** → #Wellness #BurnoutRecovery #MindBody
- **spirituality** → #Faith #Grace #Purpose
- **money** → #MoneyMindset #Wealth #FinancialWellness
- **productivity** → #DeepWork #Focus #TimeManagement

### Tag Performance Analytics
1. **View Tag Performance:** Navigate to Blog tab → scroll to "Tag Performance" section
2. **Metrics Tracked:**
   - Posts per tag
   - Total impressions
   - Total engagements
   - Engagement Rate (ER%)
   - Click-through Rate (CTR%)
   - Weekly trend sparklines
3. **Filter & Sort:**
   - Set minimum post threshold (default: 3 posts)
   - Sort by ER%, CTR%, or Impressions
4. **Actionable Suggestions:**
   - System identifies top-performing tags
   - Suggests doubling down on high-ER tags
   - Recommends testing promising low-volume tags
   - Highlights best tags for link posts (high CTR)
5. **Data Requirements:**
   - Posts must have tags assigned
   - Metrics must be collected via "Collect Metrics" button
   - View updates automatically after each collection

## Platform-Specific Notes

### LinkedIn
- Posts as UGC (User Generated Content)
- Uses article sharing format
- Requires member access token

### Facebook
- Posts to Page feed
- Requires Page access token + Page ID
- Supports link previews

### Instagram
- Two-step process: create container → publish
- Requires Business Account ID
- Graph API token with instagram_basic + instagram_content_publish

### X (Twitter)
- Uses v2 tweets API
- Requires Bearer Token (OAuth 2.0)
- 280 character limit enforced

### Chinese Platforms
- WeChat, RED, Zhihu, Douyin
- No direct API posting (restrictions)
- System generates export ZIP with:
  - Formatted text
  - Images
  - Posting guidelines
- Manual upload required

## Rate Limits & Errors

### Lovable AI
- 429: Rate limit exceeded → Wait and retry
- 402: Credits exhausted → Add credits in Settings → Workspace → Usage

### Social Platform APIs
- Proper error handling in metrics collection
- Graceful degradation if API unavailable
- Logged errors stored in `social_posts.error` column

## Automation Ideas

### Cron Jobs (Future)
```sql
-- Run social-worker every 10 minutes
-- Run social-metrics-collect every 6 hours
```

### Webhooks
- Trigger worker on blog publish
- Alert on failed posts
- Daily metrics digest

## Security

- All API tokens encrypted at rest using AES-GCM
- MASTER_KEY environment variable required
- Admin-only access to queue and secrets
- RLS policies enforce data isolation

## Monitoring

### Success Metrics
- Posts queued vs posted
- Platform-specific success rates
- Average engagement by platform
- Best performing content types

### Dashboard Metrics
- Total impressions across platforms
- Engagement rate trends
- AI suggestion acceptance rate
- Time saved vs manual posting
