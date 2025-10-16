# Booking System Security Audit & Refactoring Plan

## Executive Summary

Current booking system has **critical security vulnerabilities** and architectural issues that need immediate attention. This document outlines findings and provides a complete refactoring strategy.

---

## 🚨 Critical Security Issues

### 1. **Input Validation Gaps**

**Severity**: HIGH  
**Files Affected**: `Book.tsx`, `MobileBook.tsx`

**Issues**:
- Payment forms lack Zod validation on frontend
- Name and email inputs not sanitized before sending to API
- No length limits enforced client-side
- XSS vulnerability potential through unsanitized names

**Current Code** (Book.tsx:350-375):
```typescript
<Input
  id="name"
  type="text"
  value={customerName}
  onChange={(e) => setCustomerName(e.target.value)}  // ❌ No validation
  required
/>
```

**Required Fix**:
```typescript
const paymentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
});
```

---

### 2. **SessionStorage Security Risks**

**Severity**: HIGH  
**Files Affected**: All booking pages

**Issues**:
- Customer PII (names, emails) stored in plain text
- Data persists beyond session lifetime
- No encryption
- Vulnerable to XSS attacks
- Data accessible to any JavaScript on the domain

**Current Code**:
```typescript
sessionStorage.setItem('booking_customer_name', customerName);      // ❌ Plain text PII
sessionStorage.setItem('booking_customer_email', customerEmail);    // ❌ Security risk
sessionStorage.setItem('booking_cal_link', selectedSession.calLink);
```

**Required Fix**: Use server-side session tokens instead

---

### 3. **Cal.com Integration Vulnerabilities**

**Severity**: MEDIUM  
**Files Affected**: `Book.tsx`, `MobileBook.tsx`, `BookSession.tsx`

**Issues**:
- No webhook signature verification
- Cal.com initialization not centralized
- Multiple points of failure
- No error recovery strategy
- Client-side Cal.com modal can be manipulated

**Problems**:
- Three separate Cal.com initialization implementations
- Inconsistent error handling
- No fallback if Cal.com fails to load
- Modal state not tracked properly

---

### 4. **Payment Flow Security**

**Severity**: HIGH  
**Files Affected**: `api/create-payment-link.ts`, All booking pages

**Issues**:
- Frontend sends pricing info (should be server-only)
- No CSRF protection on payment endpoint
- Payment confirmation relies on URL parameter
- No server-side booking verification after payment
- Race condition between payment and Cal.com booking

**Current Flow** (INSECURE):
```
User selects package → Frontend sends price → API creates payment link
→ User pays → Redirected with ?payment=success → Client opens Cal.com
```

**Problem**: Anyone can access `?payment=success` without actually paying

---

### 5. **Missing Cal.com API Integration**

**Severity**: MEDIUM  
**Current State**: Using Cal.com embed/modal only

**Issues**:
- No programmatic booking creation
- Can't verify booking completion
- Payment and booking disconnected
- No server-side booking management
- Can't automatically create bookings after payment

---

## 🏗️ Architecture Issues

### 1. **Code Duplication**

Three separate booking pages with 70% duplicate code:
- `Book.tsx` (414 lines)
- `MobileBook.tsx` (402 lines)  
- `BookSession.tsx` (274 lines)

**Shared Logic**:
- Cal.com initialization (duplicated 3x)
- Payment handling (duplicated 3x)
- Session type definitions (duplicated 3x)
- Error handling (inconsistent across all)

---

### 2. **No Service Layer**

Business logic scattered in components:
- ❌ No centralized booking service
- ❌ No payment service abstraction
- ❌ No Cal.com API wrapper
- ❌ Direct API calls in components

---

### 3. **State Management Issues**

- SessionStorage used instead of proper state
- No global booking state management
- Cal.com ready state duplicated
- Loading states inconsistent

---

## 🔒 Recommended Architecture (SECURE)

### New Flow Using Cal.com API:

```
┌─────────────┐
│   Frontend  │
│             │
│ 1. User     │
│    Selects  │
│    Package  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  POST /api/booking/create           │
│                                     │
│  • Validates input (Zod)           │
│  • Creates pending booking in DB   │
│  • Creates payment link            │
│  • Returns: {                      │
│      bookingToken: "secure-jwt",   │
│      paymentUrl: "airwallex..."    │
│    }                               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  User Completes Payment (Airwallex)│
│                                     │
│  • Airwallex webhook triggers       │
│  • Server verifies payment          │
│  • Updates booking status           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  POST /api/booking/schedule         │
│                                     │
│  • Receives bookingToken            │
│  • Verifies payment completed       │
│  • Calls Cal.com API:               │
│      POST /v1/bookings              │
│  • Creates Cal.com booking          │
│  • Stores Cal.com booking ID        │
│  • Returns: {                       │
│      calBookingId: "123",           │
│      meetingUrl: "zoom..."          │
│    }                                │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Cal.com Webhook                    │
│  (already implemented)              │
│                                     │
│  • Receives booking confirmation    │
│  • Verifies signature               │
│  • Updates booking status           │
│  • Sends confirmation email         │
└─────────────────────────────────────┘
```

### Key Security Features:

1. **Server-Side Booking Tokens**
   - JWT tokens for booking sessions
   - Encrypted, time-limited
   - Can't be tampered with

2. **Database-Backed Bookings**
   - New table: `bookings`
   - Tracks: pending → paid → scheduled
   - Links payment to Cal.com booking

3. **Cal.com API Integration**
   - Programmatic booking creation
   - Server-side verification
   - Webhook confirmation

4. **Payment Verification**
   - Airwallex webhook validation
   - Server-side payment confirmation
   - No client-side payment status

---

## 📋 Implementation Plan

### Phase 1: Database Schema (IMMEDIATE)

Create new `bookings` table:
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_token TEXT UNIQUE NOT NULL,
  
  -- Customer info (encrypted)
  customer_name_enc TEXT NOT NULL,
  customer_email_enc TEXT NOT NULL,
  
  -- Booking details
  package_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  
  -- Cal.com integration
  cal_event_type_id TEXT NOT NULL,
  cal_booking_id TEXT,
  meeting_url TEXT,
  scheduled_at TIMESTAMPTZ,
  
  -- Payment tracking
  payment_provider TEXT DEFAULT 'airwallex',
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- pending, paid, scheduled, completed, cancelled
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 2: Backend Services

1. **`supabase/functions/booking-create/index.ts`**
   - Input validation
   - Create booking record
   - Generate secure token
   - Create payment link
   - Return token + payment URL

2. **`supabase/functions/booking-schedule/index.ts`**
   - Verify booking token
   - Check payment status
   - Call Cal.com API to create booking
   - Update booking record
   - Return meeting details

3. **`supabase/functions/payment-webhook/index.ts`**
   - Verify Airwallex signature
   - Update booking payment status
   - Trigger booking schedule if auto-schedule enabled

### Phase 3: Frontend Refactoring

1. **Create Unified Components**:
   - `src/components/BookingFlow.tsx` - Main flow
   - `src/hooks/useBooking.ts` - Booking logic
   - `src/lib/booking-service.ts` - API calls

2. **Remove Duplicates**:
   - Consolidate three booking pages
   - Centralize Cal.com handling
   - Unified error handling

### Phase 4: Security Hardening

1. **Input Validation**:
   - Add Zod schemas everywhere
   - Sanitize all user inputs
   - Rate limiting on all endpoints

2. **Encryption**:
   - Encrypt customer PII in database
   - Use secure tokens for sessions
   - HTTPS-only cookies

3. **CSRF Protection**:
   - Add CSRF tokens to forms
   - Validate tokens on backend

---

## 🎯 Priority Fixes (Do First)

### 1. Add Input Validation (1 hour)
```typescript
// src/lib/booking-schemas.ts
export const bookingFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  packageId: z.enum(['discovery', 'single', 'monthly', 'quarterly']),
});
```

### 2. Remove SessionStorage (30 min)
Replace with encrypted booking tokens passed via URL

### 3. Add Server-Side Payment Verification (2 hours)
Implement Airwallex webhook handler

### 4. Create Cal.com API Wrapper (3 hours)
Centralize all Cal.com API calls

---

## 📊 Risk Assessment

| Issue | Current Risk | After Fix | Priority |
|-------|--------------|-----------|----------|
| SessionStorage PII | **HIGH** | LOW | P0 |
| No Input Validation | **HIGH** | LOW | P0 |
| Payment Verification | **HIGH** | LOW | P0 |
| Code Duplication | MEDIUM | LOW | P1 |
| No Cal.com API | MEDIUM | LOW | P1 |

---

## ✅ Success Criteria

- [ ] All user inputs validated with Zod
- [ ] No PII in sessionStorage
- [ ] Server-side payment verification
- [ ] Cal.com API integration complete
- [ ] Single booking component
- [ ] All security tests passing
- [ ] Webhook signatures verified

---

## 🔗 Related Documentation

- [Cal.com API Docs](https://cal.com/docs/api-reference)
- [Airwallex Webhooks](https://www.airwallex.com/docs/api#/Webhooks)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
