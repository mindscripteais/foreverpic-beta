# EventShare — Design Specification

**Date:** 2026-04-20
**Goal:** Photo-sharing app for events via QR codes, with tiered storage and premium features

---

## Concept & Vision

EventShare = "Instagram for events, without the social pressure." Guests scan QR → join event gallery → upload photos → react. Host controls privacy, analytics, and collaboration. Clean, trust-building aesthetic — events are personal moments (weddings, birthdays, corporate), not content to "go viral."

**Differentiators vs Celebrate:**
1. Real-time photo gallery (live updates)
2. Collaborative uploads (guests add photos, not just host)
3. Advanced reactions + "best photo" voting
4. Batch download + ZIP
5. QR expiration controls
6. Storage tiers (free capped, paid unlimited)
7. Analytics dashboard

---

## Design Language

### Aesthetic Direction
Modern editorial meets trust-building SaaS. Think Linear + Notion — clean, spacious, confident. Not playful, not corporate. Approachable professionalism.

### Color Palette
| Role       | Color       | Hex       |
|------------|-------------|-----------|
| Primary    | Indigo      | `#4F46E5` |
| Secondary  | Violet      | `#7C3AED` |
| Accent     | Gold        | `#F59E0B` |
| Background | Slate-50    | `#F8FAFC` |
| Surface    | White       | `#FFFFFF` |
| Text       | Slate-900   | `#0F172A` |
| Muted      | Slate-400   | `#94A3B8` |
| Success    | Emerald     | `#10B981` |
| Error      | Red-500     | `#EF4444` |

Dark mode: slate-900 bg, white text, indigo accent.

### Typography
- Headings: **Playfair Display** (serif, editorial feel)
- Body: **Inter** (clean, readable)
- Code/mono: **JetBrains Mono**

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 8px (cards), 12px (buttons), 16px (modals)
- Shadows: subtle (0 1px 3px rgba(0,0,0,0.1))

### Motion Philosophy
- Micro-interactions: 150ms ease-out
- Page transitions: 200ms fade
- Loading states: skeleton shimmer
- No bouncy/playful animations — confident and smooth

---

## Layout & Structure

### Pages

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing + pricing | Public |
| `/auth/signin` | Login | Public |
| `/auth/signup` | Register | Public |
| `/dashboard` | Event list + stats | Auth |
| `/events/[id]` | Public event gallery | Public (via QR) |
| `/manage/[id]` | Event admin + photos | Owner/Collaborators |
| `/settings` | Account + subscription | Auth |

### Dashboard Layout
- Left sidebar (collapsible): nav + user avatar
- Main area: event grid (3 columns desktop, 2 tablet, 1 mobile)
- Top bar: search + create event CTA

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Features

### Auth (NextAuth v5)
- Email/password registration + login
- OAuth: Google, GitHub
- Session: JWT, 30-day expiry
- Protected routes via middleware

### Event Management
**Create Event:**
- Name, date, description
- Cover image ( Unsplash picker o upload)
- Privacy: Public / Private / Invite-only
- QR expiration: 7 / 30 / 90 days / Unlimited
- Collaborators: invite by email (max based on tier)

**Event Dashboard:**
- Photo count + storage used
- View count (unique visitors)
- Reaction count
- Download stats
- QR download (PDF, PNG)
- Share link copy

### Photo Upload
- Drag-drop multi-file
- Progress bar per file
- Presigned URL → direct upload to R2
- Client-side resize before upload (max 2048px)
- EXIF strip for privacy
- Watermark corner (free tier only)

### Gallery (Real-time)
- Masonry grid layout
- Lightbox on click (swipe navigation)
- Reactions: ❤️ 😂 😮 😍 🔥
- "Best photo" vote (one vote per user per event)
- Infinite scroll pagination

### Storage Limits

| Tier | Price | Storage/Event | Events/Month | QR Expiry | Watermark | Collaborators |
|------|-------|---------------|--------------|-----------|-----------|---------------|
| Free | $0 | 500MB | 3 | 30 days | Yes | 0 |
| Pro | $9/mo | 5GB | Unlimited | Unlimited | No | 5 |
| Enterprise | $29/mo | 50GB | Unlimited | Unlimited | No | Unlimited |

**Storage enforcement:**
- Pre-upload check: estimate file sizes vs remaining
- Block upload when limit reached
- Dashboard warning when < 20% remaining

### Stripe Integration
- Checkout for subscription upgrade
- Webhook handler: `customer.subscription.created`, `updated`, `deleted`
- Free tier: no card required
- Prorata downgrade handling

### QR Generation
- Server-side generation with `qrcode` library
- Output: SVG (scalable) + PNG (download)
- PDF template: QR + event name + date + branding
- QR contains: `https://eventshare.app/events/[id]?token=[guest-token]`

---

## Component Inventory

### EventCard
- Cover image (or gradient placeholder)
- Event name, date
- Photo count badge
- Storage usage bar
- Quick actions: view, manage, duplicate, delete
- States: default, hover (lift shadow), loading skeleton

### PhotoGrid
- Masonry layout (CSS columns)
- Lazy loading with blur placeholder
- Lightbox overlay
- Reaction badges on hover
- "Best photo" crown badge

### QRUploader
- Generate button → creates QR
- Preview of QR
- Download PNG / PDF buttons
- Copy link button
- Tier badge (Pro shows watermark-free)

### UploadZone
- Drag-drop area with dashed border
- File type validation (jpg, png, heic, webp)
- Size validation (max 20MB per file)
- Progress bars (individual + total)
- Cancel button
- States: idle, dragging, uploading, success, error

### ReactionBar
- 6 emoji buttons with counts
- Animate count change (+1 pop)
- User's own reaction highlighted
- Best photo vote button

### SubscriptionBadge
- Tier name + color chip
- Upgrade CTA if free
- Usage indicator (X/Y GB used)

### StorageIndicator
- Progress bar (color changes: green → yellow → red)
- Text: "2.3GB of 5GB used"
- Click expands to file breakdown

---

## Technical Architecture

### Stack
- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS
- **Backend:** Next.js API Routes + tRPC
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Storage:** Cloudflare R2 (S3-compatible)
- **Auth:** NextAuth.js v5
- **Payments:** Stripe (subscriptions)
- **QR:** `qrcode` + `sharp`
- **Email:** Resend
- **Real-time:** Pusher (for live photo updates)

### Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  stripeCustomerId String?
  subscriptionTier SubscriptionTier @default(FREE)
  createdAt     DateTime  @default(now())
  events        Event[]   @relation("EventOwner")
  collaborations Event[] @relation("EventCollaborators")
}

enum SubscriptionTier {
  FREE
  PRO
  ENTERPRISE
}

model Event {
  id            String    @id @default(cuid())
  name          String
  description   String?
  date          DateTime
  coverImage    String?
  privacy       Privacy   @default(PUBLIC)
  qrExpiresAt   DateTime?
  ownerId       String
  owner         User      @relation("EventOwner", fields: [ownerId], references: [id])
  collaborators User[]   @relation("EventCollaborators")
  photos        Photo[]
  createdAt     DateTime  @default(now())
  views         Int       @default(0)
}

enum Privacy {
  PUBLIC
  PRIVATE
  INVITE_ONLY
}

model Photo {
  id        String    @id @default(cuid())
  url       String
  thumbnail String
  size      Int
  width     Int
  height    Int
  eventId   String
  event     Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  uploaderId String
  reactions Reaction[]
  votes     Vote[]
  createdAt DateTime  @default(now())
}

model Reaction {
  id      String    @id @default(cuid())
  type    ReactionType
  userId  String
  photoId String
  photo   Photo     @relation(fields: [photoId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, photoId, type])
}

enum ReactionType {
  LOVE
  LAUGH
  WOW
  Heart
  FIRE
}

model Vote {
  id      String @id @default(cuid())
  userId  String
  photoId String
  photo   Photo  @relation(fields: [photoId], references: [id], onDelete: Cascade)

  @@unique([userId, photoId])
}

model Subscription {
  id               String   @id @default(cuid())
  stripeSubscriptionId String @unique
  stripeCustomerId String
  tier             SubscriptionTier
  currentPeriodEnd DateTime
  createdAt        DateTime @default(now())
}
```

### API Routes (tRPC)

```typescript
// Events
event.create // POST — create event
event.list   // GET — list user's events
event.get    // GET — get event by id
event.update // PATCH — update event
event.delete // DELETE — remove event

// Photos
photo.upload // POST — get presigned URL
photo.list   // GET — list event photos (paginated)
photo.delete // DELETE — remove photo

// Reactions
reaction.add   // POST — add reaction
reaction.remove // DELETE — remove reaction

// Votes
vote.cast  // POST — vote for best photo
vote.remove // DELETE — remove vote

// QR
qr.generate // GET — generate QR code SVG/PNG

// Users
user.me        // GET — current user profile + usage
user.upgrade   // POST — create Stripe checkout session

// Webhooks
stripe.webhook // POST — handle Stripe events
```

### File Storage Flow
1. Client requests presigned URL from tRPC `photo.upload`
2. Server generates presigned PUT URL to R2 (5min expiry)
3. Client uploads directly to R2
4. Client calls `photo.confirm` with R2 key
5. Server creates Photo record in DB

---

## Storage Calculation

### Per-User Storage
```typescript
function getUserStorageLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case 'FREE':    return 500 * 1024 * 1024;      // 500MB
    case 'PRO':     return 5 * 1024 * 1024 * 1024;  // 5GB
    case 'ENTERPRISE': return 50 * 1024 * 1024 * 1024; // 50GB
  }
}
```

### Per-Event Storage
Free tier: 500MB/evento cap
Pro/Enterprise: no per-event cap (solo limit total)

### Storage Check Flow
```
1. sumPhotoSizes(eventId) + newFileSize > eventLimit?
   → Yes: reject with "Storage limit reached"
2. sumUserAllEventSizes(userId) + newFileSize > userTierLimit?
   → Yes: reject with "Upgrade to Pro for unlimited storage"
3. OK: generate presigned URL
```

---

## Error Handling

| Scenario | Response |
|----------|----------|
| Upload over limit | 400 + `{ error: "STORAGE_LIMIT_EXCEEDED", message: "..." }` |
| Not authenticated | 401 + redirect to signin |
| Not authorized (event) | 403 + "You don't have access to this event" |
| Event not found | 404 + "Event not found or QR expired" |
| Stripe webhook fail | 500 + log to monitoring |
| R2 upload fail | 500 + cleanup DB record + retry |

---

## Security Considerations

- Presigned URLs: 5-min expiry, content-type validation
- File type: check magic bytes, not just extension
- EXIF strip on upload (privacy)
- Rate limiting: 100 uploads/hour per user
- QR tokens: random 32-char, not guessable
- Stripe webhook: verify signature
- CORS: only allow app domain

---

## Analytics Events (for dashboard)

- `event_view` — increment on gallery load
- `photo_upload` — count + size
- `reaction_added` — type + photoId
- `vote_cast` — photoId
- `qr_download` — format (png/pdf)
- `storage_warning` — triggered at 80% usage