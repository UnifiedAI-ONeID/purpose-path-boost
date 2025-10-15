# A/B Testing Pricing System Guide

## Overview

Complete A/B testing system for dynamic pricing optimization across markets. Test different price points, track conversions, and automatically adopt winning variants.

## Features

### 1. **AI-Powered Suggestions**
- PPP-adjusted pricing recommendations
- Market-specific heuristics
- Multi-tier pricing strategies

### 2. **Automated Test Creation**
- One-click test setup with A/B/C variants
- Automatic spread calculation (default ±10%)
- Regional targeting

### 3. **Visitor Assignment**
- Automatic price variant assignment
- Visitor tracking via IP/cookie
- Seamless frontend integration

### 4. **Conversion Tracking**
- Real-time statistics
- Conversion rate calculation
- Revenue tracking per variant

### 5. **Winner Adoption**
- Automatic best-performer selection
- One-click override application
- Test lifecycle management

## Architecture

### Database Schema

**`event_price_tests`**
```sql
- id: UUID
- event_id: UUID (references events)
- ticket_id: UUID (references event_tickets)
- region: TEXT (country code)
- variant: TEXT (A, B, C, etc.)
- price_cents: INTEGER
- currency: TEXT
- started_at: TIMESTAMPTZ
- ended_at: TIMESTAMPTZ
- is_active: BOOLEAN
```

**`event_price_assignments`**
```sql
- id: UUID
- test_id: UUID (references event_price_tests)
- visitor_id: TEXT (IP or cookie)
- country: TEXT
- variant: TEXT
- price_cents: INTEGER
- currency: TEXT
- assigned_at: TIMESTAMPTZ
```

**`v_price_test_stats`** (view)
- Aggregates conversion metrics
- Joins tests, assignments, and registrations
- Calculates: visitors, purchases, revenue, conversion rate %

### API Endpoints

#### 1. Get AI Suggestions
```
POST /api/admin/pricing/suggest
```

**Request:**
```json
{
  "ticket_id": "uuid",
  "base_price_cents": 19900,
  "base_currency": "USD",
  "country": "CN"
}
```

**Response:**
```json
{
  "ok": true,
  "heur": {
    "suggest_cents": 9999,
    "currency": "CNY",
    "reasoning": "PPP adjustment (55%) + FX conversion"
  }
}
```

#### 2. Apply Suggestion & Start A/B Test
```
POST /api/admin/pricing/apply-suggestion
```

**Request:**
```json
{
  "event_id": "uuid",
  "ticket_id": "uuid",
  "country": "CN",
  "currency": "CNY",
  "suggest_cents": 9999,
  "spread_pct": 0.10
}
```

**Response:**
```json
{
  "ok": true,
  "override": {
    "currency": "CNY",
    "price_cents": 9999
  },
  "variants": [
    { "variant": "A", "price_cents": 8999, "currency": "CNY" },
    { "variant": "B", "price_cents": 9999, "currency": "CNY" },
    { "variant": "C", "price_cents": 10999, "currency": "CNY" }
  ]
}
```

**What it does:**
1. Creates/updates currency override at suggested price
2. Generates 3 test variants (A: -10%, B: baseline, C: +10%)
3. Deactivates any existing active tests for that ticket+region
4. Activates new test variants

#### 3. Assign Visitor to Variant
```
POST /api/pricing/assign
```

**Request:**
```json
{
  "ticket_id": "uuid",
  "country": "CN"
}
```

**Response:**
```json
{
  "ok": true,
  "variant": "B",
  "price_cents": 9999,
  "currency": "CNY"
}
```

**What it does:**
1. Finds active tests for ticket+region
2. Randomly assigns visitor to a variant
3. Records assignment for tracking
4. Returns assigned price

#### 4. Adopt Winning Variant
```
POST /api/admin/pricing/adopt-winner
```

**Request:**
```json
{
  "event_id": "uuid",
  "ticket_id": "uuid",
  "country": "CN",
  "currency": "CNY"
}
```

**Response:**
```json
{
  "ok": true,
  "winner": {
    "variant": "C",
    "price_cents": 10999,
    "currency": "CNY",
    "conv_rate_pct": 8.5,
    "revenue_cents": 329700
  }
}
```

**What it does:**
1. Queries `v_price_test_stats` for best-performing variant
2. Ranks by conversion rate, then revenue
3. Creates/updates currency override with winning price
4. Ends all active tests for that ticket+region

## Frontend Integration

### Admin UI (Event Edit Page)

**`<PriceTesting />`** component shows:
- Country selector
- "Get Suggestions" button
- AI-suggested price display
- "Apply & Start A/B Test" button
- "Adopt Winning Variant" button
- Status notes

**Workflow:**
1. Select target market (country)
2. Click "Get Suggestions"
3. Review AI-recommended price
4. Click "Apply & Start A/B Test"
   - Creates override
   - Seeds A/B/C variants
   - Test begins immediately
5. Monitor results (check stats view)
6. Click "Adopt Winner" when ready
   - Applies best variant as override
   - Ends test

### Public Event Page

**Auto-assignment on page load:**
```tsx
useEffect(() => {
  // Detect user country
  const country = await fetch('https://ipapi.co/json/').then(r => r.json());
  
  // Try to get A/B test assignment
  const assign = await fetch('/api/pricing/assign', {
    method: 'POST',
    body: JSON.stringify({ ticket_id, country: country.country_code })
  });
  
  if (assign.ok) {
    // Use assigned price & currency
    setPrice(assign.price_cents);
    setCurrency(assign.currency);
  } else {
    // Fallback to standard pricing
    // ...
  }
}, [ticketId]);
```

## Usage Workflow

### Step 1: Get AI Suggestions
1. Go to `/admin/events/:slug`
2. Scroll to ticket you want to test
3. Select target market (e.g., "CN")
4. Click "Get Suggestions"

### Step 2: Review & Apply
- AI suggests: ¥99.99 CNY
- Reasoning: "PPP adjustment (55%) + FX conversion"
- Click "Apply & Start A/B Test"

### Step 3: System Creates Variants
- **Variant A**: ¥89.99 (-10%)
- **Variant B**: ¥99.99 (baseline)
- **Variant C**: ¥109.99 (+10%)

All marked as `is_active: true` for region "CN"

### Step 4: Visitors Get Assigned
- User from China visits event page
- System detects country = CN
- Randomly assigns to variant B
- Shows price: ¥99.99
- Records assignment in `event_price_assignments`

### Step 5: Track Conversions
When user completes registration:
- `event_regs` records their email & payment status
- View `v_price_test_stats` calculates:
  - Visitors per variant
  - Purchases per variant
  - Conversion rate %
  - Total revenue

### Step 6: Analyze Results
```sql
SELECT region, variant, visitors, purchases, conv_rate_pct, revenue_cents
FROM v_price_test_stats
WHERE ticket_id = 'xxx' AND region = 'CN'
ORDER BY conv_rate_pct DESC;
```

Example results:
| Variant | Visitors | Purchases | Conv Rate | Revenue |
|---------|----------|-----------|-----------|---------|
| C       | 150      | 13        | 8.67%     | ¥1,429  |
| B       | 148      | 11        | 7.43%     | ¥1,099  |
| A       | 152      | 10        | 6.58%     | ¥899    |

**Variant C wins!** (highest conversion & revenue)

### Step 7: Adopt Winner
1. Click "Adopt Winning Variant"
2. System automatically:
   - Sets currency override: CNY → 10999 cents
   - Ends all active tests for CN region
   - Returns winner stats

## Monitoring & Analytics

### Check Active Tests
```sql
SELECT * FROM event_price_tests 
WHERE is_active = true 
ORDER BY started_at DESC;
```

### View Test Performance
```sql
SELECT * FROM v_price_test_stats
WHERE event_id = 'xxx'
ORDER BY conv_rate_pct DESC;
```

### Check Assignments
```sql
SELECT variant, COUNT(*) as count
FROM event_price_assignments
WHERE test_id = 'xxx'
GROUP BY variant;
```

### Revenue Analysis
```sql
SELECT 
  t.variant,
  t.price_cents / 100.0 as price,
  COUNT(DISTINCT a.visitor_id) as visitors,
  SUM(CASE WHEN r.status = 'paid' THEN 1 ELSE 0 END) as purchases,
  SUM(CASE WHEN r.status = 'paid' THEN r.amount_cents ELSE 0 END) / 100.0 as revenue
FROM event_price_tests t
LEFT JOIN event_price_assignments a ON a.test_id = t.id
LEFT JOIN event_regs r ON r.email = a.visitor_id
WHERE t.ticket_id = 'xxx'
GROUP BY t.variant, t.price_cents;
```

## Best Practices

### 1. Test Duration
- Run tests for at least 100 visitors per variant
- Minimum 1 week for stable results
- Consider seasonal variations

### 2. Statistical Significance
- Look for clear winner (>2% conversion difference)
- Consider revenue, not just conversion rate
- Higher price + lower conversion might still win on revenue

### 3. Market Segmentation
- Test one market at a time
- Different markets may have different winners
- Consider local purchasing power

### 4. Price Spread
- Default ±10% is conservative
- For high-uncertainty markets, try ±20%
- For mature markets, try ±5%

### 5. Iteration
- After adopting winner, run new test
- Test even higher/lower prices
- Continuously optimize

## Security

### RLS Policies
- `event_price_tests`: Admin-only management
- `event_price_assignments`: 
  - Public INSERT (for visitor assignment)
  - Admin SELECT (for analysis)

### Admin Endpoints
All require `requireAdmin()` middleware:
- `/api/admin/pricing/suggest`
- `/api/admin/pricing/apply-suggestion`
- `/api/admin/pricing/adopt-winner`

### Input Validation
- Country codes validated against supported list
- Price cents must be non-negative
- Spread percentage: 0-1 range
- Currency codes uppercased

## Troubleshooting

### No Test Assignment
**Problem**: Visitor doesn't get assigned to test
**Causes:**
- No active tests for that ticket+region
- Test just ended
- Wrong region detection

**Solution:**
```sql
-- Check active tests
SELECT * FROM event_price_tests 
WHERE ticket_id = 'xxx' AND region = 'CN' AND is_active = true;
```

### Low Conversion Rates
**Problem**: All variants have <2% conversion
**Possible causes:**
- All prices too high
- Poor event description
- Wrong target audience

**Solution:** Try testing lower price range

### Unbalanced Assignment
**Problem**: Variant A has 200 visitors, B has 50, C has 45
**Cause:** Long-running test with late variant additions

**Solution:** End test and start fresh for balanced comparison

### Winner Not Clear
**Problem**: Variants have similar conversion rates (5.1% vs 5.3%)
**Solution:**
- Run test longer for more data
- Calculate confidence intervals
- Consider revenue as tiebreaker

## Integration Checklist

- [x] Database tables created
- [x] RLS policies configured
- [x] Stats view created
- [x] Admin endpoints implemented
- [x] Public assignment endpoint working
- [x] Admin UI components built
- [x] Frontend auto-assignment integrated
- [x] Security validated (no raw SQL)
- [ ] Analytics dashboard (optional enhancement)
- [ ] Email notifications for test milestones (optional)

## Future Enhancements

### 1. Confidence Intervals
Calculate statistical significance for conversion differences

### 2. Multi-Armed Bandit
Gradually shift traffic to winning variants during test

### 3. Automated Winner Adoption
Auto-adopt winner after reaching significance threshold

### 4. Email Notifications
Alert admin when test reaches statistical significance

### 5. Dashboard
Dedicated page showing all active tests and results

### 6. Time-based Analysis
Track conversion by day/hour for timing optimization

## Example: Complete Test Cycle

**Initial State:**
- Event: "Life Coaching Workshop"
- Ticket: "General Admission"
- Base: USD $199

**Target Market:** China (CN)

**Step 1:** Get suggestion
```
POST /api/admin/pricing/suggest
{ country: "CN", base_price_cents: 19900, base_currency: "USD" }

Response: CNY ¥999 (¥9.99)
```

**Step 2:** Apply & start test
```
POST /api/admin/pricing/apply-suggestion
{ suggest_cents: 999, spread_pct: 0.10 }

Creates:
- A: ¥8.99
- B: ¥9.99
- C: ¥10.99
```

**Step 3:** Run for 2 weeks
- 450 total visitors from CN
- Roughly 150 per variant

**Step 4:** Check results
```
v_price_test_stats shows:
- A: 6.5% conversion, ¥1,350 revenue
- B: 7.2% conversion, ¥1,495 revenue  
- C: 8.1% conversion, ¥1,778 revenue ← Winner
```

**Step 5:** Adopt winner
```
POST /api/admin/pricing/adopt-winner

Result: CNY override set to 10.99, test ended
```

**Outcome:** 8.1% conversion rate with ¥10.99 pricing for China market
