# Reconstructed Firestore Database Overview

## 1. Architecture Philosophy
This database model transitions from a relational Supabase structure to a **user-centric document model** typical of Firestore. 

- **User-Centricity**: Data belonging to a user (goals, sessions, progress) is nested under `/users/{uid}` or referenced directly by `userId`.
- **Read Optimization**: Public content (blogs, events, offers) is stored in top-level collections optimized for high-frequency reads.
- **Security**: Access is controlled via Firestore Security Rules relying on Custom Claims or a `roles` field in the user document.

## 2. Core Schema Map

### 👤 User Domain
| Collection Path | Document ID | Purpose | Supabase Origin |
| key | key | --- | --- |
| `/users` | `{uid}` | Core profile & role data. | `zg_profiles`, `user_roles` |
| `/users/{uid}/goals` | `{goalId}` | Personal coaching goals. | `me_goals` |
| `/users/{uid}/sessions` | `{sessionId}` | Coaching session records. | `me_sessions` |
| `/users/{uid}/notifications`| `{nudgeId}` | In-app nudges/alerts. | `nudge_inbox` |
| `/users/{uid}/receipts` | `{receiptId}` | Purchase history. | `me_receipts` |

### 📅 Booking & Events Domain
| Collection Path | Document ID | Purpose | Supabase Origin |
| key | key | --- | --- |
| `/bookings` | `{bookingId}` | 1:1 Coaching or Event bookings. | `cal_bookings` |
| `/events` | `{eventId}` | Public/Private Events. | `events` |
| `/events/{id}/registrations`| `{regId}` | User tickets/registrations. | `event_regs` |

### 🛍️ Commerce & Content Domain
| Collection Path | Document ID | Purpose | Supabase Origin |
| key | key | --- | --- |
| `/products/coaching` | `{offerId}` | Coaching packages/offers. | `coaching_offers` |
| `/orders` | `{orderId}` | Ecommerce orders. | `express_orders` |
| `/leads` | `{leadId}` | Marketing leads. | `leads` |
| `/content/blog` | `{postId}` | Blog posts. | `blog_posts` |
| `/lessons` | `{lessonId}` | Learning modules. | `lessons` |

### ⚙️ System Configuration
| Collection Path | Document ID | Purpose | Supabase Origin |
| key | key | --- | --- |
| `/config` | `{configKey}` | Global settings (e.g., `funnels`, `event_types`). | `funnels`, `cal_event_types` |

## 3. Key Relationships & Patterns
- **User References**: Almost all operational documents (`bookings`, `orders`, `leads`) store `userId` as a string reference to `/users/{uid}`.
- **Denormalization**: 
  - User `displayName` and `email` are often copied into `bookings` and `orders` to reduce reads.
  - Event details (title, time) are copied into `registrations`.
- **Role Management**: Roles (`client`, `coach`, `admin`) are stored in `/users/{uid}.roles`. Security rules enforce these.

## 4. Next Steps for Developers
1. **Apply Rules**: Deploy `firestore.rules`.
2. **Apply Indexes**: Deploy `firestore_indexes.json`.
3. **Service Layer**: Implement TypeScript services (see `src/services/firestore_example.ts`) to wrap Firestore calls.
4. **Import Data**: Use the provided CSV templates in `tools/import_templates/` to backfill data when ready.
