# Complete Pricing System Guide

## Overview

This guide covers the complete multi-currency pricing system including FX conversion, overrides, A/B testing, and AI-powered suggestions.

## Features

### 1. Multi-Currency Support
- **Base Currency**: Each ticket has a base price in a specific currency
- **Auto FX Conversion**: Automatic conversion to supported currencies using live rates
- **Psychological Pricing**: Smart rounding (e.g., .99 endings)
- **Buffer**: Configurable margin (default 1.5%) to cover FX fluctuations

### 2. Currency Overrides
- Set fixed prices for specific currencies
- Overrides bypass FX conversion
- Useful for strategic market pricing

### 3. Price Breakdown & Auditing
- **FX Audit**: View complete price calculation breakdown
- **Rate Transparency**: See when FX rates were last updated
- **Source Tracking**: Know if price is from override or FX

### 4. A/B Testing
- Test different price points by region
- Track visitor assignments and conversions
- Analyze conversion rates per variant

### 5. AI-Powered Pricing Suggestions
- PPP-based recommendations
- Market-specific pricing heuristics
- Multi-tier suggestions (entry/sweet-spot/premium)

## Database Schema

### Core Tables

**`pricing_settings`** (singleton)
- `buffer_bps`: Exchange rate buffer in basis points (150 = 1.5%)
- `supported`: Array of supported currencies
- `cny_rounding`: CNY rounding style ('yuan' or 'fen99')

**`fx_rates`**
- `base`: Base currency (e.g., 'USD')
- `rates`: JSONB of exchange rates
- `updated_at`: Last update timestamp

**`event_ticket_fx_overrides`**
- `ticket_id`: Reference to ticket
- `currency`: Target currency
- `price_cents`: Fixed price in cents

### A/B Testing Tables

**`event_price_tests`**
- `event_id`, `ticket_id`: References
- `region`: Country/region code
- `variant`: Test variant name (A, B, C, etc.)
- `price_cents`, `currency`: Test price
- `is_active`: Test status

**`event_price_assignments`**
- `test_id`: Reference to test
- `visitor_id`: Unique visitor identifier
- `variant`: Assigned variant
- `price_cents`, `currency`: Assigned price

**`v_price_test_stats`** (view)
- Aggregates conversion metrics per variant
- Calculates: visitors, purchases, revenue, conversion rate

## API Endpoints

### FX Management

**`GET /api/fx/update`**
- Updates FX rates from exchangerate.host
- Fetches USD, EUR, CNY rates
- Service role only

**`GET /api/admin/fx/rates`**
- Returns current settings and rate timestamps
- Admin only

**`POST /api/admin/fx/update`**
- Triggers FX rate refresh
- Admin only

**`POST /api/admin/fx/inspect`**
- Returns detailed price breakdown for a ticket
- Params: `ticket_id`, `currency`
- Admin only

### Price Overrides

**`GET /api/admin/tickets/overrides?ticket_id=xxx`**
- Get all overrides for a ticket
- Admin only

**`POST /api/admin/tickets/overrides`**
- Create/update override
- Body: `{ ticket_id, currency, price_cents }`
- Admin only

**`DELETE /api/admin/tickets/overrides`**
- Delete override
- Body: `{ ticket_id, currency }`
- Admin only

### Public Pricing

**`POST /api/events/price-preview`**
- Get price for a ticket in target currency
- Body: `{ ticket_id, currency }`
- Returns: `{ ok, currency, display_cents, charge_cents, source }`

### A/B Testing

**`GET /api/pricing/assign?ticket_id=xxx&country=XX`**
- Assigns visitor to price test variant
- Returns: `{ ok, variant, price_cents, currency }`

**`POST /api/admin/pricing/suggest`**
- AI-powered pricing suggestions
- Body: `{ ticket_id, base_price_cents, base_currency, country }`
- Returns PPP-adjusted recommendations
- Admin only

## Frontend Components

### Admin Components

**`<FxAuditGlobal />`**
- Displays global FX settings
- Shows rate update timestamps
- Refresh button for updating rates
- Location: Admin Pricing page

**`<FxAuditTicket ticketId={string} />`**
- Detailed price breakdown per ticket
- Currency selector
- Shows: base → FX → buffer → rounding
- Location: Event Edit page (per ticket)

**`<FxOverridesEditor ticketId={string} />`**
- Manage currency overrides
- Add/edit/delete overrides
- Location: Event Edit page (per ticket)

**`<PriceTesting ticketId={string} basePrice={number} baseCurrency={string} />`**
- Get AI pricing suggestions
- Country selector
- PPP-based recommendations
- Location: Event Edit page (per ticket)

### Public Components

Currency selector on event detail page:
```tsx
<select value={selectedCurrency} onChange={updateCurrency}>
  {['USD','CAD','EUR','GBP','HKD','SGD','CNY'].map(c => 
    <option key={c} value={c}>{c}</option>
  )}
</select>
```

## Admin Pages

### `/admin/pricing`
- Global FX settings overview
- Rate management
- Refresh controls

### `/admin/events/:slug`
- Per-ticket pricing configuration
- FX overrides
- Price auditing
- Pricing suggestions

## Usage Examples

### 1. Set Up Base Pricing

```sql
-- Set ticket base price
UPDATE event_tickets 
SET base_currency = 'USD', base_price_cents = 19900 
WHERE id = 'xxx';
```

### 2. Add Currency Override

```bash
POST /api/admin/tickets/overrides
{
  "ticket_id": "xxx",
  "currency": "CNY",
  "price_cents": 9999
}
```

### 3. Update FX Rates (Cron Job)

```bash
# Add to vercel.json or cron
GET /api/fx/update
```

Recommended: Run daily at 00:00 UTC

### 4. Get Price for Customer

```jsx
const priceData = await fetch('/api/events/price-preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    ticket_id: ticketId, 
    currency: userCurrency 
  })
});

// Use priceData.display_cents and priceData.currency
```

### 5. Set Up A/B Test

```sql
-- Create test variants for Hong Kong market
INSERT INTO event_price_tests (event_id, ticket_id, region, variant, price_cents, currency, is_active)
VALUES
  ('event-id', 'ticket-id', 'HK', 'A', 15000, 'HKD', true),
  ('event-id', 'ticket-id', 'HK', 'B', 19900, 'HKD', true),
  ('event-id', 'ticket-id', 'HK', 'C', 24900, 'HKD', true);
```

### 6. Analyze A/B Results

```sql
SELECT region, variant, visitors, purchases, conv_rate_pct, 
       RANK() OVER (PARTITION BY region ORDER BY conv_rate_pct DESC) as rank
FROM v_price_test_stats
WHERE event_id = 'xxx'
ORDER BY region, rank;
```

## Price Calculation Logic

### Order of Operations

1. **Check for Override**: If override exists for target currency → use it
2. **Same Currency**: If target = base → apply rounding only
3. **FX Conversion**: 
   - Load FX rate (base → target or via USD pivot)
   - Convert: `base_cents * rate`
   - Apply buffer: `cents * (1 + buffer_bps/10000)`
   - Apply psychological rounding

### Psychological Rounding

**Standard (.99 rule)**
```
$19.50 → $19.99
$20.01 → $20.99
```

**CNY (configurable)**
- `yuan`: Round to whole yuan (¥20.00)
- `fen99`: Round to .99 (¥19.99)

## Configuration

### Global Settings

```sql
-- Update buffer to 2%
UPDATE pricing_settings 
SET buffer_bps = 200 
WHERE id = true;

-- Add new supported currency
UPDATE pricing_settings 
SET supported = array_append(supported, 'AUD') 
WHERE id = true;

-- Change CNY rounding
UPDATE pricing_settings 
SET cny_rounding = 'fen99' 
WHERE id = true;
```

## Security

### RLS Policies

- **Price Tests**: Admin-only management
- **Assignments**: Public insert (for visitor assignment), admin view
- **Overrides**: Admin-only
- **Settings**: Public read, admin write
- **FX Rates**: Public read, service role write

### Environment Variables

Required for full functionality:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY` (for admin endpoints)
- `AIRWALLEX_TOKEN` (for payment processing)
- `GOOGLE_AI_API_KEY` (optional, for AI suggestions)

## Troubleshooting

### Prices Not Converting
- Check if FX rates are current: `/api/admin/fx/rates`
- Run manual update: `POST /api/admin/fx/update`
- Check if target currency is in `supported` list

### Override Not Working
- Verify override exists: `GET /api/admin/tickets/overrides?ticket_id=xxx`
- Check currency code is uppercase
- Verify ticket_id is correct

### A/B Test Not Assigning
- Confirm test is active: `is_active = true`
- Check region matches visitor country
- Verify test has correct ticket_id

## Performance

### Caching Recommendations
- Cache FX rates for 24 hours
- Cache price calculations per ticket+currency for 1 hour
- Invalidate on override changes

### Database Indexes
```sql
CREATE INDEX idx_fx_overrides_ticket ON event_ticket_fx_overrides(ticket_id, currency);
CREATE INDEX idx_price_tests_active ON event_price_tests(ticket_id, region, is_active);
CREATE INDEX idx_price_assignments_visitor ON event_price_assignments(visitor_id, test_id);
```

## Migration Checklist

- [x] Database tables created
- [x] RLS policies applied
- [x] Views configured with security_invoker
- [x] API endpoints implemented
- [x] Admin components built
- [x] Public price preview working
- [x] FX rate updates automated
- [ ] Leaked password protection enabled (recommended)

## Next Steps

1. **Enable Password Protection**: Follow link from security linter
2. **Set Up Cron**: Schedule daily FX rate updates
3. **Configure Currencies**: Update `pricing_settings.supported` for your markets
4. **Test Pricing**: Use FX Audit components to verify calculations
5. **Run A/B Tests**: Set up price tests for key markets
6. **Monitor Conversion**: Track `v_price_test_stats` regularly
