# Multi-Currency Pricing System

## Overview

The events platform now supports multi-currency pricing with automatic FX conversion, psychological pricing, and per-currency overrides.

## Features

### 1. Base Currency System
- Each ticket has a `base_currency` and `base_price_cents`
- Prices are automatically converted to user's preferred currency
- Supports: USD, CAD, EUR, GBP, HKD, SGD, CNY

### 2. Exchange Rate Management
- FX rates are cached in the `fx_rates` table
- Update rates via: `/api/fx/update` endpoint
- Rates are fetched from exchangerate.host API
- Should be updated daily via cron job

### 3. Pricing Logic Priority
1. **Hard Overrides** (highest priority) - Set via admin panel for specific currencies
2. **FX Conversion** - Automatic conversion using cached rates with buffer
3. **Base Currency** - Falls back to ticket's base currency

### 4. Psychological Pricing
- Most currencies: Rounds to `*.99` (e.g., $19.99)
- CNY: Can be set to `*.00` (yuan) or `*.99` (fen99) in settings
- Configurable via `pricing_settings` table

### 5. Price Buffer
- Default: +1.50% (150 basis points)
- Protects against FX fluctuations and payment fees
- Configurable in `pricing_settings.buffer_bps`

## Database Schema

### Tables
- `event_tickets` - Base pricing (base_currency, base_price_cents)
- `event_ticket_fx_overrides` - Per-currency hard overrides
- `fx_rates` - Cached exchange rates (base currency + rates JSON)
- `pricing_settings` - Global settings (buffer, supported currencies, rounding)

## API Endpoints

### Public Endpoints
- `GET/POST /api/events/price-preview` - Preview price in any currency
  ```json
  {
    "ticket_id": "uuid",
    "currency": "CNY"
  }
  ```

- `POST /api/events/register` - Register with currency selection
  ```json
  {
    "event_id": "uuid",
    "ticket_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "CNY",
    "coupon_code": "SAVE20"
  }
  ```

### Admin Endpoints
- `POST /api/fx/update` - Update exchange rates (run daily)
- `GET/POST/DELETE /api/admin/tickets/overrides` - Manage currency overrides

## Admin Interface

### Setting Currency Overrides
1. Go to Admin Events → Select Event
2. Each ticket shows base price
3. Expand "Currency Overrides" section
4. Add specific prices for CNY, EUR, etc.
5. Overrides bypass FX conversion

### Example Use Cases

**Scenario 1: Round Number Pricing in China**
- Base: USD 29.99
- FX + buffer: CNY 218.76
- Override: CNY 199.00 (clean round number)

**Scenario 2: Regional Pricing**
- Base: USD 99.00
- Override CAD: $129.00 (avoid unfavorable FX)
- Override EUR: €89.00 (competitive European price)

## Price Resolution Flow

```
User selects currency → Check override → If found, use it
                     ↓
                     If not found → Check FX rate
                     ↓
                     Convert: base × rate × buffer
                     ↓
                     Apply psychological rounding
                     ↓
                     Return final price
```

## Frontend Integration

### EventDetail.tsx
- Currency selector dropdown
- Live price preview on currency change
- Coupon application (applied AFTER currency conversion)
- Final price shown before payment

### Registration Flow
1. User selects ticket + currency
2. Price previewed in real-time
3. Optional coupon applied
4. Final amount locked at registration
5. Airwallex payment created in user's currency

## Configuration

### Update Exchange Rates
Set up a daily cron job:
```bash
curl -X POST https://yourdomain.com/api/fx/update
```

### Pricing Settings
Update via database:
```sql
UPDATE pricing_settings SET
  buffer_bps = 200,  -- 2.0% buffer
  cny_rounding = 'yuan'  -- or 'fen99'
WHERE id = true;
```

### Supported Currencies
Add/remove in `pricing_settings.supported`:
```sql
UPDATE pricing_settings SET
  supported = '{USD,CAD,EUR,GBP,HKD,SGD,CNY,JPY}'
WHERE id = true;
```

## Security

- All currency overrides require admin authentication
- FX updates can be public (read-only rate data)
- Price locking: Final price stored in `event_regs.amount_cents` + `currency`
- No price tampering: Server calculates final price, not client

## Testing

### Test Price Preview
```bash
curl -X POST https://yourdomain.com/api/events/price-preview \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"xxx","currency":"CNY"}'
```

### Test Registration
1. Select CNY currency
2. Verify price shows "CNY 199.00" format
3. Complete registration
4. Check `event_regs` table for correct `currency` and `amount_cents`

## Troubleshooting

**Prices not updating?**
- Check if `/api/fx/update` has been run
- Verify `fx_rates` table has recent data
- Check console logs for FX fetch errors

**Wrong currency shown?**
- Verify currency is in `pricing_settings.supported` array
- Check browser console for API errors
- Ensure Supabase RLS policies allow reading `fx_rates`

**Overrides not working?**
- Confirm admin authentication working
- Check `event_ticket_fx_overrides` table for data
- Verify ticket_id matches exactly

## Future Enhancements

- [ ] Auto-update FX rates via Supabase cron
- [ ] Support more currencies (JPY, AUD, NZD)
- [ ] Currency-specific payment methods
- [ ] Bulk override management
- [ ] Price history tracking
- [ ] A/B testing different price points
