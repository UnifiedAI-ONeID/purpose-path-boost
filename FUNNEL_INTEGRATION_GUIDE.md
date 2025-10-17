# Funnel Integration Guide

## ✅ Implementation Complete

The funnel upsell system is now **fully integrated** into your lesson players and will automatically display after users complete lessons that have funnel triggers attached.

## How It Works

### Automatic Trigger Flow

1. **User watches a lesson** via `LessonPlayerYT` or `LessonPlayerLite`
2. **User completes the lesson** (video ends or reaches 100%)
3. **System checks** if that lesson has any funnel triggers attached
4. **If funnel exists**, a beautiful modal appears with:
   - Custom headline from funnel config
   - Custom subtitle/description
   - CTA button that navigates to pricing page
   - "Maybe Later" option to dismiss

### Setting Up Funnels (Admin)

#### Step 1: Create a Funnel
1. Go to `/admin/pricing`
2. Click **Funnels** tab
3. Fill in:
   - **Slug**: `growth-upsell`
   - **Name**: `Growth Plan Upsell` (admin display only)
   - **Target Plan Slug**: `growth`
   - **Config JSON**:
   ```json
   {
     "copy": {
       "headline": "Ready for More?",
       "sub": "Upgrade to Growth and unlock unlimited lessons"
     },
     "cta": "/pricing?highlight=growth"
   }
   ```
4. Click **Save Funnel**

#### Step 2: Attach to Lessons
1. In the same **Funnels** tab, scroll to "Attach Funnel to Lesson"
2. Enter:
   - **Lesson Slug**: `intro-to-mindfulness` (the free lesson users will complete)
   - **Funnel Slugs**: `growth-upsell` (comma-separated for multiple)
3. Click **Link Funnels**

✅ **Done!** Now when users complete `intro-to-mindfulness`, they'll see your upsell modal.

## Example Usage Scenarios

### Scenario 1: Free Trial Conversion
**Goal**: Convert free users after their first lesson

1. Create funnel: `first-lesson-upsell`
   - Headline: "Loved Your First Lesson?"
   - Sub: "Get unlimited access for just $29/month"
   - CTA: `/pricing?highlight=starter`

2. Attach to: `intro-to-mindfulness`, `breathing-basics`

**Result**: Users see upsell after completing any intro lesson

### Scenario 2: Mid-Tier to Premium Upsell
**Goal**: Upsell Starter users to Growth plan

1. Create funnel: `premium-features-upsell`
   - Headline: "Unlock Advanced Techniques"
   - Sub: "Upgrade to Growth for expert-level content"
   - CTA: `/pricing?highlight=growth`

2. Attach to: Last lessons of starter-tier packages

**Result**: Users hit natural upgrade point when finishing starter content

### Scenario 3: Multiple Funnels per Lesson
**Goal**: A/B test different messaging

1. Create two funnels:
   - `value-focused-upsell`: Emphasizes content value
   - `savings-focused-upsell`: Emphasizes price savings

2. Attach both to the same lesson (comma-separated):
   ```
   Lesson Slug: advanced-meditation
   Funnel Slugs: value-focused-upsell, savings-focused-upsell
   ```

**Result**: System shows the first funnel (you can later enhance with random selection)

## Funnel Config Options

### Basic Config
```json
{
  "copy": {
    "headline": "Your headline here",
    "sub": "Your subtitle here"
  },
  "cta": "/pricing?highlight=growth"
}
```

### CTA URL Options
- `/pricing` - General pricing page
- `/pricing?highlight=growth` - Highlight specific plan
- `/coaching` - Direct to coaching booking
- `/pricing?coupon=SPECIAL20` - Apply coupon code
- Any other route in your app

## Frontend Integration

### Dialog Component
**Location**: `src/components/FunnelUpsellDialog.tsx`

**Features**:
- Automatic funnel lookup when opened
- Beautiful centered modal with sparkle icon
- Primary CTA button navigates to configured URL
- "Maybe Later" dismisses without action
- Only shows if funnel is actually attached to lesson

### Lesson Player Integration

Both `LessonPlayerYT` and `LessonPlayerLite` now:
1. Track lesson completion
2. Trigger `markComplete()` when video ends
3. Open `FunnelUpsellDialog` after completion
4. Pass lesson slug to dialog for funnel lookup

**Code Added**:
```typescript
// State
const [showFunnelDialog, setShowFunnelDialog] = useState(false);

// On complete
const markComplete = async () => {
  await saveProgress(true);
  trackEvent('complete');
  setShowFunnelDialog(true); // 🎯 Show funnel
};

// Render
<FunnelUpsellDialog
  lessonSlug={slug}
  open={showFunnelDialog}
  onOpenChange={setShowFunnelDialog}
/>
```

## Helper Library

**Location**: `src/lib/funnels.ts`

**Public Functions**:

```typescript
// Get all funnels for a lesson
const funnels = await getFunnelsForLesson('lesson-slug');

// Get primary funnel (first one)
const funnel = await getPrimaryFunnelForLesson('lesson-slug');
```

**Usage in Custom Components**:
```typescript
import { getPrimaryFunnelForLesson } from '@/lib/funnels';

async function handleCustomCompletion(slug: string) {
  const funnel = await getPrimaryFunnelForLesson(slug);
  
  if (funnel) {
    // Show your custom UI with funnel data
    showCustomModal({
      title: funnel.config?.copy?.headline,
      description: funnel.config?.copy?.sub,
      ctaUrl: funnel.config?.cta
    });
  }
}
```

## Testing Your Funnels

### Test Workflow
1. Create a test funnel in admin
2. Attach it to a lesson
3. Open that lesson in the app
4. Complete the lesson (let video play to end)
5. **Modal should appear automatically**

### Debug Checklist
- ✅ Funnel created with valid config JSON
- ✅ Funnel attached to correct lesson slug
- ✅ Lesson slug matches exactly (case-sensitive)
- ✅ Video played to completion
- ✅ Console has no errors

### Database Verification
Check your funnel triggers:
```sql
SELECT * FROM lesson_funnel_triggers WHERE lesson_slug = 'your-lesson-slug';
```

Should return rows with your funnel slugs.

## Analytics & Optimization

### Current Tracking
- Lesson completion events logged
- Can track when users complete lessons with funnels

### Future Enhancements
1. **Track Funnel Impressions**:
   - Log when funnel dialog opens
   - Count how many users see each funnel

2. **Track Conversions**:
   - Log when "View Plans" clicked
   - Track if user upgrades after seeing funnel

3. **A/B Testing**:
   - Randomly assign funnels when multiple exist
   - Compare conversion rates

4. **Personalization**:
   - Show different funnels based on user plan
   - Customize messaging by user progress

## Best Practices

### Funnel Copy
✅ **DO**:
- Keep headlines short (5-7 words)
- Focus on user benefits, not features
- Use emotional triggers ("Ready for More?", "Don't Miss Out")
- Include clear value proposition

❌ **DON'T**:
- Use salesy language ("BUY NOW!!")
- Overwhelm with text
- Be vague ("Learn More")
- Use ALL CAPS

### Placement Strategy
✅ **DO**:
- Attach to popular free lessons
- Place at natural stopping points
- Target lessons that showcase value
- Test different placements

❌ **DON'T**:
- Spam every lesson
- Interrupt learning flow too early
- Show same funnel repeatedly
- Ignore user context

### CTA Optimization
✅ **DO**:
- Pre-highlight recommended plan
- Include query params for tracking
- Use deep links when possible
- Make action clear

Example: `/pricing?highlight=growth&source=lesson-complete&lesson=intro-to-mindfulness`

## Troubleshooting

### "Funnel not showing"
**Cause**: No funnel attached to that lesson
**Fix**: Check `lesson_funnel_triggers` table, ensure slug matches exactly

### "Wrong funnel showing"
**Cause**: Multiple funnels attached, showing first one
**Fix**: Remove unwanted funnels or change order

### "Modal appears but closes immediately"
**Cause**: State management issue
**Fix**: Check `open` prop is controlled correctly

### "CTA link not working"
**Cause**: Invalid URL in config
**Fix**: Verify CTA starts with `/` for internal routes

## Next Steps

1. **Create Your First Funnel**
   - Go to `/admin/pricing` → Funnels tab
   - Set up a simple "starter-upsell" funnel
   - Attach to your most popular free lesson

2. **Test It**
   - Watch that lesson
   - Complete it
   - Verify modal appears
   - Check CTA works

3. **Iterate**
   - Try different copy
   - Test different placements
   - Monitor conversions
   - Optimize based on data

## System Status

✅ **Database**: Tables created with RLS
✅ **Edge Functions**: All endpoints deployed
✅ **Admin UI**: Full management interface
✅ **Frontend**: Dialog component ready
✅ **Integration**: Lesson players wired
✅ **Helper Library**: Available for custom use
✅ **Documentation**: Complete

🎯 **Ready for production use!**
