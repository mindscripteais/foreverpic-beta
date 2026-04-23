# EventShare

Photo-sharing platform for events via QR codes. Guests scan → join gallery → upload photos → react in real-time. Host controls privacy, analytics, and collaboration.

## Features

- **QR Code Gallery** — Generate QR for any event, guests upload photos without account
- **Real-time Updates** — Photos appear live as guests upload
- **Reactions + Voting** — ❤️ 😂 😮 😍 🔥 plus "best photo" voting
- **Tiered Storage** — Free 500MB/evento, Pro 5GB, Enterprise 50GB
- **No Watermark** — Pro/Enterprise get clean downloads
- **Collaborative** — Guests can add photos (not just host)
- **Batch Download** — ZIP entire event or selection
- **Analytics** — Views, downloads, engagement per event

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TailwindCSS
- **Backend:** tRPC + Next.js API Routes
- **Database:** PostgreSQL (Neon) + Prisma
- **Storage:** Cloudflare R2
- **Auth:** NextAuth.js v5
- **Payments:** Stripe
- **Real-time:** Pusher

## Quick Start

```bash
# Clone + install
npm install

# Setup env
cp .env.example .env.local
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, STRIPE_KEYS, R2_*

# Migrate DB
npx prisma migrate dev

# Start dev
npm run dev
```

## Environment Variables

```
DATABASE_URL=          # Neon PostgreSQL
NEXTAUTH_SECRET=        # Random 32 char string
NEXTAUTH_URL=           # http://localhost:3000
GOOGLE_CLIENT_ID=       # OAuth
GOOGLE_CLIENT_SECRET=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
RESEND_API_KEY=
```

## Storage Tiers

| Tier | Price | Storage | Events/mo | Watermark | Collaborators |
|------|-------|---------|-----------|-----------|---------------|
| Free | $0 | 500MB/event | 3 | Yes | 0 |
| Pro | $9/mo | 5GB/event | Unlimited | No | 5 |
| Enterprise | $29/mo | 50GB/event | Unlimited | No | Unlimited |

## Project Structure

```
/app
  /(auth)           # Sign in, sign up
  /(app)            # Dashboard, manage, settings
  /(public)         # Event gallery (QR landing)
  /api              # tRPC, webhooks
/components         # UI components
/lib                # Prisma, auth, stripe, r2, trpc
/prisma             # Schema + migrations
```

## Status

- [x] Pianificazione completata
- [ ] Setup progetto
- [ ] MVP implementation
- [ ] Polish + launch

## License

MIT