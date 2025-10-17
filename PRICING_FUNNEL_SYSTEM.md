# Pricing & Funnel System - Complete Implementation

## Overview
A comprehensive system for managing subscription pricing tiers, lesson packages, and automated upsell funnels. This system enables flexible content bundling, multi-currency pricing, and intelligent conversion optimization.

## Database Schema

### Core Tables

#### `plans` (Extended)
Enhanced subscription tier table with Airwallex integration:
```sql
- slug: text (PK) - Unique plan identifier (e.g., 'starter', 'growth', 'pro')
- title: text - Display name
- monthly_usd_cents: integer - Monthly price in cents
- annual_usd_cents: integer - Annual price in cents
- features: jsonb - Feature flags and limits
- active: boolean - Whether plan is available
- price_id_month: text - Airwallex price ID for monthly billing
- price_id_year: text - Airwallex price ID for annual billing
- blurb: text - Marketing copy
- faq: jsonb - FAQ items array
```

#### `lesson_packages`
Curated collections of lessons that can be sold or bundled:
```sql
- id: uuid (PK)
- slug: text UNIQUE - Package identifier
- title: text - Display name
- summary: text - Description
- poster_url: text - Cover image
- active: boolean
- created_at: timestamptz
```

#### `package_lessons`
Ordered mapping between packages and lessons:
```sql
- package_id: uuid (FK → lesson_packages.id)
- lesson_slug: text (FK → lessons.slug)
- order_index: integer - Display order
- PRIMARY KEY (package_id, lesson_slug)
```

#### `plan_includes`
Defines which packages are included in each plan:
```sql
- plan_slug: text (FK → plans.slug)
- package_id: uuid (FK → lesson_packages.id)
- PRIMARY KEY (plan_slug, package_id)
```

#### `funnels`
Upsell funnel configurations:
```sql
- id: uuid (PK)
- slug: text UNIQUE
- name: text - Admin display name
- target_plan_slug: text (FK → plans.slug) - Which plan to upsell to
- config: jsonb - Funnel configuration
  {
    "copy": {
      "headline": "Unlock All Lessons",
      "sub": "Join Growth and get unlimited access"
    },
    "cta": "/pricing?highlight=growth"
  }
```

#### `lesson_funnel_triggers`
Attaches funnels to specific lesson completion events:
```sql
- lesson_slug: text (FK → lessons.slug)
- funnel_slug: text (FK → funnels.slug)
- PRIMARY KEY (lesson_slug, funnel_slug)
```

## Edge Functions

### Plan Management

#### `api-admin-plans-list` (GET)
- **Auth**: Requires admin JWT
- **Returns**: Array of all plans with pricing and features
- **Usage**: Admin dashboard plan listing

#### `api-admin-plans-upsert` (POST)
- **Auth**: Requires admin JWT
- **Body**: Plan object (creates new or updates existing by slug)
- **Returns**: `{ ok: true }`

#### `api-admin-plans-delete` (POST)
- **Auth**: Requires admin JWT
- **Body**: `{ slug: string }`
- **Returns**: `{ ok: true }`

### Package Management

#### `api-admin-packages-list` (GET)
- **Auth**: Requires admin JWT
- **Returns**: Array of packages with lesson counts
- **Example**:
```json
{
  "ok": true,
  "rows": [
    {
      "id": "uuid",
      "slug": "mindfulness-basics",
      "title": "Mindfulness Basics",
      "summary": "Learn the fundamentals...",
      "lesson_count": 8,
      "active": true
    }
  ]
}
```

#### `api-admin-packages-upsert` (POST)
- **Auth**: Requires admin JWT
- **Body**: Package object (id present = update, absent = create)

#### `api-admin-package-lessons-set` (POST)
- **Auth**: Requires admin JWT
- **Body**: 
```json
{
  "package_id": "uuid",
  "lessons": [
    { "slug": "intro-to-mindfulness", "order_index": 0 },
    { "slug": "breathing-basics", "order_index": 1 }
  ]
}
```
- **Note**: Replaces all existing lessons for the package

### Plan-Package Mapping

#### `api-admin-plan-includes-set` (POST)
- **Auth**: Requires admin JWT
- **Body**:
```json
{
  "plan_slug": "growth",
  "package_ids": ["uuid1", "uuid2", "uuid3"]
}
```
- **Purpose**: Define which packages are included in a subscription tier
- **Note**: Replaces all existing mappings for the plan

### Funnel Management

#### `api-admin-funnels-list` (GET)
- **Auth**: Requires admin JWT
- **Returns**: Array of all funnels with config

#### `api-admin-funnels-upsert` (POST)
- **Auth**: Requires admin JWT
- **Body**: Funnel object with config JSON

#### `api-admin-funnel-triggers-set` (POST)
- **Auth**: Requires admin JWT
- **Body**:
```json
{
  "lesson_slug": "intro-to-mindfulness",
  "funnel_slugs": ["growth-upsell", "pro-upsell"]
}
```
- **Purpose**: Attach funnels to lesson completion events

## Admin UI

### Location
`/admin/pricing` - Comprehensive pricing management interface

### Tabs

#### 1. **Tiers Tab**
- Create/edit subscription plans
- Set monthly/annual pricing
- Configure Airwallex price IDs
- Add marketing copy (blurb, FAQ)
- Toggle active status
- Delete plans

**Form Fields**:
- Slug (identifier)
- Title
- Monthly price (cents)
- Annual price (cents)
- Features JSON
- Airwallex Price ID (monthly)
- Airwallex Price ID (annual)
- Blurb (marketing copy)
- FAQ JSON array
- Active checkbox

#### 2. **Packages Tab**
- Create/edit lesson packages
- Attach lessons to packages (with ordering)
- View lesson counts
- Manage package metadata

**Workflow**:
1. Create package with slug, title, summary
2. Enter lesson slugs (comma-separated) in quick-add field
3. Select package and click "Save Lessons"

#### 3. **Mapping Tab**
- Link packages to subscription plans
- Visual checkbox grid
- Shows which content is included in each tier

**Usage**:
1. Select a plan from dropdown
2. Check packages to include
3. Click "Save Mapping"

#### 4. **Funnels Tab**
- Create upsell funnels
- Configure funnel copy and CTA
- Attach funnels to specific lessons

**Funnel Config Example**:
```json
{
  "copy": {
    "headline": "Unlock All Lessons",
    "sub": "Upgrade to Growth for unlimited access"
  },
  "cta": "/pricing?highlight=growth"
}
```

**Attach Workflow**:
1. Enter lesson slug
2. Enter funnel slugs (comma-separated)
3. Click "Link Funnels"

## Frontend Integration

### Funnel Display Helper

Location: `src/lib/funnels.ts`

```typescript
import { getPrimaryFunnelForLesson } from '@/lib/funnels';

// On lesson completion
async function handleLessonComplete(lessonSlug: string) {
  // Mark as complete...
  
  const funnel = await getPrimaryFunnelForLesson(lessonSlug);
  
  if (funnel) {
    showUpsellModal({
      title: funnel.config?.copy?.headline || 'Unlock More',
      subtitle: funnel.config?.copy?.sub || 'Upgrade today',
      ctaHref: funnel.config?.cta || `/pricing?highlight=${funnel.target_plan_slug}`
    });
  }
}
```

### Example Integration Points

1. **Lesson Player Component**
   - On video complete event
   - Check for funnel triggers
   - Display modal with upgrade CTA

2. **Course Progress Component**
   - When user completes package
   - Show next package upsell

3. **Paywall Component**
   - When user hits content limit
   - Display relevant funnel

## Security & RLS Policies

All tables have RLS enabled with the following policies:

**Public Read Access**:
- `lesson_packages` (active only)
- `package_lessons`
- `plan_includes`
- `funnels`
- `lesson_funnel_triggers`

**Admin Only**:
- All write operations (INSERT, UPDATE, DELETE)
- Requires `is_admin()` function to return true

**Edge Functions**:
- All admin endpoints require JWT verification
- Verified in `supabase/config.toml` with `verify_jwt = true`

## Typical Workflows

### Setting Up a New Subscription Tier

1. **Create Plan** (Tiers Tab)
   - Set slug: `professional`
   - Set pricing: `$99/mo`, `$990/yr`
   - Configure features JSON
   - Add Airwallex price IDs
   - Write marketing copy

2. **Create Packages** (Packages Tab)
   - Create "Advanced Training" package
   - Attach 10 premium lessons
   - Create "Masterclass Series" package
   - Attach 5 expert lessons

3. **Map Packages to Plan** (Mapping Tab)
   - Select "professional" plan
   - Check both packages
   - Save mapping

4. **Create Upsell Funnel** (Funnels Tab)
   - Create "pro-upsell" funnel
   - Target: `professional`
   - Set compelling copy
   - CTA: `/pricing?highlight=professional`

5. **Attach Funnel Triggers** (Funnels Tab)
   - Select a popular free lesson
   - Link to "pro-upsell"
   - Users completing that lesson see upsell

### Managing Content Access

**Check if user has access to lesson**:
1. Query user's active subscription
2. Get plan slug from subscription
3. Query `plan_includes` for plan's packages
4. Query `package_lessons` for included lessons
5. Check if requested lesson is in the list

**Example Query Flow**:
```sql
-- Get user's plan packages
SELECT lp.*
FROM plan_includes pi
JOIN lesson_packages lp ON pi.package_id = lp.id
WHERE pi.plan_slug = 'growth';

-- Get all lessons in those packages
SELECT pl.lesson_slug, pl.order_index
FROM package_lessons pl
WHERE pl.package_id IN (SELECT package_id FROM plan_includes WHERE plan_slug = 'growth')
ORDER BY pl.order_index;
```

## API Client Integration

All endpoints mapped in `src/lib/api-client.ts`:

```typescript
const ROUTE_MAP = {
  '/api/admin/plans/list': 'api-admin-plans-list',
  '/api/admin/plans/upsert': 'api-admin-plans-upsert',
  '/api/admin/plans/delete': 'api-admin-plans-delete',
  '/api/admin/packages/list': 'api-admin-packages-list',
  // ... etc
};
```

**Usage**:
```typescript
import { invokeApi } from '@/lib/api-client';

const result = await invokeApi('/api/admin/plans/list');
if (result.ok) {
  console.log(result.rows);
}
```

## Testing & Validation

### Test Scenarios

1. **Create Complete Tier**:
   - Create plan with pricing
   - Create 2-3 packages with lessons
   - Map packages to plan
   - Verify in frontend that user with this plan sees correct content

2. **Funnel Flow**:
   - Create funnel with compelling copy
   - Attach to popular free lesson
   - Complete the lesson as test user
   - Verify modal appears with correct CTA

3. **Package Management**:
   - Create package
   - Add 5 lessons
   - Reorder lessons
   - Remove 2 lessons
   - Add 3 new lessons
   - Verify order persists

## Extension Ideas

### Future Enhancements

1. **A/B Testing Funnels**:
   - Multiple funnels per lesson
   - Random assignment
   - Conversion tracking

2. **Dynamic Pricing**:
   - Time-limited discounts
   - Regional pricing adjustments
   - Student/educator discounts

3. **Package Bundles**:
   - Cross-sell other packages
   - "Buy 2, get 1 free" logic
   - Bundle pricing overrides

4. **Advanced Access Control**:
   - Time-based access (30-day trial)
   - Credit system (X lessons per month)
   - Download limits

5. **Funnel Analytics**:
   - Track funnel impressions
   - Measure conversion rates
   - Optimize copy based on data

## Troubleshooting

### Common Issues

**Funnel not showing after lesson completion**:
- Check `lesson_funnel_triggers` table for entry
- Verify funnel is not null
- Check browser console for errors
- Ensure RLS policies allow public read

**Package lessons not appearing**:
- Verify `package_lessons` entries exist
- Check lesson slugs match exactly
- Ensure `order_index` is set correctly

**Plan mapping not working**:
- Verify `plan_includes` entries exist
- Check plan slug and package IDs match
- Test queries manually in SQL editor

**Admin UI not loading data**:
- Check browser console for 401 errors
- Verify JWT is being sent
- Confirm user has admin role in `zg_admins` table
- Check edge function logs for errors

## System Status

✅ **Fully Operational**
- Database schema created and secured
- All edge functions deployed and tested
- Admin UI fully functional
- API routes properly mapped
- Funnel helper library ready
- Documentation complete

🎯 **Ready for Production**
- All components integrated
- Security policies enforced
- Admin interface intuitive
- Frontend helpers available
