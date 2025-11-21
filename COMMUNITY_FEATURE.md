# ZhenGrowth Community Lounge

## Goal

Create a **private, safe community space** for ZhenGrowth clients where they can:
- Share wins, struggles, and insights
- Ask questions and get feedback
- Support and empower each other
- Interact with coaches in a structured way

This MUST be:
- Gated to authenticated ZhenGrowth users only
- Easy to moderate (admins/coaches can remove harmful content)
- Mobile-friendly (PWA-ready)
- Future-proof for bilingual use (English + Chinese).

## Community Features – MVP Scope

Implement at least these 4 core features:

1.  **Community Feed ("Lounge")**
    -   Chronological feed of posts from clients and coaches.
    -   Post types:
        -   Text posts
        -   (Optional) image attachments
        -   Tags (e.g. #Win, #Question, #Accountability)
    -   Users can:
        -   Create posts
        -   Like/react
        -   Comment

2.  **Topic Channels / Circles**
    -   Simple grouping mechanism:
        -   e.g. "Career Change", "Entrepreneurship", "Mindset", "Relationships"
    -   Each post belongs to one main topic.
    -   Clients can filter feed by topic.
    -   Later: cohort-based circles (e.g. “Cohort Oct 2025”).

3.  **“Wins Wall”**
    -   Lightweight view that only shows posts tagged #Win / #Gratitude.
    -   Purpose: keep community energy high and encouraging.
    -   Sorted by most recent.

4.  **Coach Announcements**
    -   Special post type from coach/admin accounts:
        -   Highlighted in feed (e.g. badge “Coach Post”).
        -   Can be pinned to top.
    -   Used for:
        -   Weekly prompts
        -   Challenges
        -   New events/resources.

Keep UI very simple in MVP:
- One main “Community” tab/section in navigation.
- Inside it: tabs for [Feed] [Wins] [Topics].

## Roles & Auth Model

Use Firebase Auth + Firestore to model roles:

-   Role types:
    -   "client"
    -   "coach"
    -   "admin"
-   Store role on user profile document:
    -   /users/{userId}:
        -   displayName
        -   avatarUrl
        -   role
        -   languagePreference (e.g. "en", "zh-TW", "zh-CN")

Rules:
- Only authenticated users can read/write community content.
- Clients can:
    - Create posts and comments
    - Edit/delete their own posts and comments
    - Like/unlike posts
- Coaches/admins can:
    - Do everything clients can
    - Pin/unpin posts
    - Soft-delete any post/comment (mark as "removedByModerator")
    - Ban / mute users (by setting flags on /users/{userId})

## Firestore Data Model for Community

Design **minimal but scalable** collections:

1)  Posts collection:
    -   /community_posts/{postId}
        -   authorId
        -   authorRole ("client" | "coach" | "admin")
        -   content (string, support multiline)
        -   createdAt (timestamp)
        -   updatedAt (timestamp | null)
        -   topic (string, e.g. "career", "mindset")
        -   tags: array of strings (e.g. ["win", "gratitude"])
        -   isPinned (boolean)
        -   isDeleted (boolean)
        -   deletedReason (optional string)
        -   likesCount (number)
        -   commentsCount (number)

2)  Comments subcollection:
    -   /community_posts/{postId}/comments/{commentId}
        -   authorId
        -   content
        -   createdAt
        -   updatedAt
        -   isDeleted
        -   deletedReason

3)  Likes subcollection (optional, or use aggregate field only):
    -   /community_posts/{postId}/likes/{userId}
        -   createdAt

4)  Reports (for moderation):
    -   /community_reports/{reportId}
        -   postId
        -   commentId (optional)
        -   reporterId
        -   reason (string)
        -   status ("open" | "reviewing" | "closed")
        -   createdAt
        -   resolvedAt (optional)
        -   resolvedBy (adminId)

Indexes:
- Needed composite indexes:
    - community_posts ordered by createdAt, filtered by topic
    - community_posts ordered by createdAt, filtered by tags (e.g. "win")
    - community_posts ordered by isPinned desc, createdAt desc

## Firestore Security Rules (Community)

Define secure rules for the community module, such as:

-   Only authenticated users can read/write.
-   Users can only edit/delete their own posts and comments, EXCEPT:
    -   Coaches/admins can modify any document for moderation purposes.
-   Prevent mass downloads:
    -   Limit queries by requiring orderBy + limit.
-   Example logic (pseudocode, you will turn into actual Firestore rules):

```
match /community_posts/{postId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && isRegisteredUser(request.auth.uid);
  allow update, delete: if
    isOwner(resource.data.authorId, request.auth.uid) ||
    isCoachOrAdmin(request.auth.uid);
}

match /community_posts/{postId}/comments/{commentId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && isRegisteredUser(request.auth.uid);
  allow update, delete: if
    isOwner(resource.data.authorId, request.auth.uid) ||
    isCoachOrAdmin(request.auth.uid);
}

And for /community_reports:
- allow create by any authenticated user
- read/update restricted to coaches/admins

Implement helper functions in rules:
- isRegisteredUser(uid)
- isCoachOrAdmin(uid)
- isOwner(authorId, uid)
```

## Community UI / UX Implementation

Frontend tasks:

1.  Navigation
    -   Add "Community" entry in main app navigation for signed-in users only.
    -   If user not authenticated, redirect to login.

2.  Community Feed Screen
    -   Show:
        -   Pinned coach posts at top
        -   Then regular posts sorted by createdAt desc
    -   Each post card shows:
        -   Author name, role badge
        -   Topic chip (e.g. “Career”)
        -   Tags (e.g. “#Win”)
        -   Time since posted
        -   Like button with count
        -   Comment count + button to open comments
    -   “New Post” button:
        -   Simple modal or drawer
        -   Fields: topic, tags (select or chips), content (multiline)

3.  Comments Drawer/Page
    -   When opening a post:
        -   Show full content
        -   List of comments
    -   Input at bottom to add comment.
    -   Support delete/edit own comments.

4.  Wins Wall
    -   Filter posts where tags includes "win" OR "gratitude".
    -   Show lighter, celebratory vibe (you can use emojis, subtle UI hints).

5.  Topic Filter
    -   Simple tabs or dropdown to switch between:
        -   All
        -   Career
        -   Mindset
        -   Entrepreneurship
        -   etc. (configurable from Firestore, not hardcoded if possible)

6.  Localization (Optional but Recommended)
    -   Prepare UI copy so it can support both English and Chinese.
    -   Store current language in user profile and/or browser settings.

## Notifications & Engagement Loops

Optional but recommended:

1.  Email / push notifications
    -   When:
        -   Someone comments on your post
        -   Coach posts a new announcement
    -   Use:
        -   Firebase Cloud Messaging (for push)
        -   Or cloud functions to send transactional emails

2.  Weekly “Prompt” Post
    -   Setup a cloud function (scheduled) that:
        -   Once a week creates a coach post with a reflection question or challenge.
    -   Example:
        -   "What is one small win you had this week?" (#Win)

3.  Simple Gamification (later)
    -   Track:
        -   community_posts_count on user profile
        -   community_comments_count
    -   Use this later to:
        -   Show badges or “Highly Engaged Member” indicators.

## Moderation & Safety

Implement minimal moderation features from Day 1:

1.  Reporting
    -   Every post/comment has a "Report" option.
    -   Creates document in /community_reports.

2.  Admin Panel (simple)
    -   A screen only accessible by coaches/admins:
        -   Lists open reports
        -   Allows:
            -   View reported content
            -   Soft-delete content (set isDeleted = true)
            -   Add moderator note
            -   Change report status

3.  Content display rules
    -   If isDeleted = true:
        -   In UI show:
            -   "This post has been removed by a moderator."
    -   Never fully delete from DB immediately (for audit / disputes).

## Checklist – Community Done When:

-   [ ] "Community" tab appears for signed-in users.
-   [ ] Clients can create posts and comments.
-   [ ] Feed shows posts with topics and tags.
-   [ ] Wins Wall view shows only #Win/#Gratitude posts.
-   [ ] Role-based permissions work (clients vs coaches/admins).
-   [ ] Firestore Security Rules prevent unauthorized access/modification.
-   [ ] Basic reporting and moderation flow exists.
-   [ ] Documented:
        -   Data model
        -   Rules
        -   How to add new topics/tags
        -   How to moderate

Always favor SIMPLE, CLEAR flows over complex social features. This is a **coaching community**, not a public social network. Prioritize psychological safety and empowerment.
