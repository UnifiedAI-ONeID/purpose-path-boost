# Booking & Payment Integration Setup

This document explains the complete booking and payment flow for ZhenGrowth coaching sessions.

## Overview

The booking system integrates three key services:
1. **Cal.com** - For scheduling and calendar management
2. **Airwallex** - For payment processing
3. **Analytics** - For tracking conversions and user behavior

## User Flow

### Free Discovery Session
1. User clicks "Schedule Now" on Discovery Session card
2. Cal.com modal opens directly
3. User selects time slot and completes booking
4. Confirmation email sent automatically by Cal.com

### Paid Sessions (Single Session, Monthly Package)
1. User clicks "Pay & Schedule" button
2. Payment form appears requesting name and email
3. User submits payment form
4. Redirected to Airwallex checkout page
5. After successful payment, redirected back to `/book?payment=success`
6. Cal.com modal opens automatically with pre-filled customer info
7. User selects time slot to complete booking

## Cal.com Setup

### 1. Create Cal.com Account
- Sign up at [cal.com](https://cal.com)
- Create event types for each session:
  - `zhengrowth/discovery` (30 min, free)
  - `zhengrowth/single-session` (60 min)
  - `zhengrowth/monthly-package` (60 min)

### 2. Configure Event Types
For each event type:
- Set duration (30 or 60 minutes)
- Configure availability hours (9am-5pm recommended)
- Add booking questions (name, email, goals, challenges)
- Set up confirmation email templates
- Enable Google Meet or Zoom for video calls

### 3. Update Cal Links
Edit `src/pages/Book.tsx` and update the `calLink` values:
```typescript
{
  calLink: 'your-username/discovery',
  // ... other session types
}
```

## Airwallex Payment Setup

### 1. Create Airwallex Account
- Sign up at [airwallex.com](https://www.airwallex.com)
- Complete business verification
- Get API credentials from dashboard

### 2. Get API Credentials
From Airwallex Dashboard:
1. Go to Settings → API Keys
2. Generate API Key and Client ID
3. Copy both values securely

### 3. Configure Environment Variables

For **Vercel** (Production):
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following:

```
AIRWALLEX_API_KEY=your_api_key_here
AIRWALLEX_CLIENT_ID=your_client_id_here
VITE_SITE_URL=https://zhengrowth.com
```

For **Local Development**:
Create a `.env.local` file:
```
AIRWALLEX_API_KEY=your_api_key_here
AIRWALLEX_CLIENT_ID=your_client_id_here
VITE_SITE_URL=http://localhost:8080
```

### 4. Testing
Without credentials configured:
- API returns mock payment URLs for development
- Allows testing the full flow without real charges

With credentials configured:
- Test in Airwallex sandbox mode first
- Use test card numbers from Airwallex docs
- Verify webhooks are received correctly

## Pricing Configuration

Prices are defined in two places (must match):

**Frontend** (`src/lib/airwallex.ts`):
```typescript
export const COACHING_PACKAGES = {
  discovery: { price: 0, ... },
  single: { price: 200, ... },
  monthly: { price: 800, ... },
  quarterly: { price: 1900, ... },
}
```

**Backend** (`api/create-payment-link.ts`):
```typescript
const PACKAGE_PRICING = {
  discovery: { price: 0, ... },
  single: { price: 200, ... },
  monthly: { price: 800, ... },
  quarterly: { price: 2100, ... },
}
```

⚠️ **Important**: Backend pricing is the source of truth for security. Frontend prices are for display only.

## Payment Return URLs

After successful payment:
- Airwallex redirects to: `/book?payment=success`
- Cal.com modal opens automatically
- Customer info pre-filled from payment form

## Analytics Events

The booking flow tracks these events:
- `page_view` - User visits /book page
- `booking_initiated` - User clicks schedule/pay button
- `payment_initiated` - Payment form submitted
- `payment_redirect` - Redirected to Airwallex
- `payment_failed` - Payment processing error
- `book_complete` - Booking confirmed via Cal.com

View analytics in the Admin Dashboard at `/admin`

## Booking CTAs Across Site

All booking CTAs now route to `/book`:

- Home page hero: "Book Your Free Session" → `/book`
- Home page footer: "Take the Quiz" → `/quiz`
- About page: "Book Free Call" → `/book`
- Coaching Programs: "Book Free Call" → `/book`
- Blog pages: "Book a Free Session" → `/book`

## Security Features

### Rate Limiting
- 10 requests per minute per IP address
- Prevents payment link abuse

### Input Validation
- Zod schema validation on backend
- Email format verification
- Name sanitization (removes special characters)
- Price validation (server-side only)

### CORS Configuration
- Restricted origins in production
- Proper headers for API access

## Troubleshooting

### Cal.com Modal Not Opening
- Check browser console for errors
- Verify Cal.com script is loaded (check index.html)
- Ensure `window.Cal` is defined

### Payment Link Creation Fails
- Verify Airwallex credentials are set
- Check API key has proper permissions
- Review server logs for error details

### Wrong Pricing Displayed
- Update both frontend and backend pricing
- Backend price always takes precedence
- Clear browser cache after changes

### Return URL Issues
- Verify `VITE_SITE_URL` is set correctly
- Check Airwallex dashboard for return URL config
- Use full HTTPS URL in production

## Support

For issues:
1. Check browser console for errors
2. Review server logs in Vercel
3. Test with Airwallex sandbox mode
4. Verify all environment variables are set
5. Contact Cal.com support for scheduling issues
6. Contact Airwallex support for payment issues
