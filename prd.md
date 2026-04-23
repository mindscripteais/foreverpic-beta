# EventShare — Product Requirements Document

## Nome progetto
EventShare

## Tipo progetto
SaaS (Web App)

## Obiettivo
Photo-sharing platform for events where guests upload photos via QR code. Host manages gallery, privacy, analytics. Tiered storage (free/pro/enterprise) via Stripe.

## Problema che risolve
Celebrate e app similari: watermarks fastidiose, limite eventi stringenti, nessuna real-time collaboration, storage limit troppo basso per eventi reali. EventShare: no watermark su Pro, storage generoso, real-time gallery, collaborative uploads.

## Utente target
- Host: chi organizza eventi (wedding planner, fotografo, azienda, privato)
- Guest: partecipanti senza account che caricano foto via QR

## MVP
1. Auth email/password + OAuth (Google)
2. Create event con QR code
3. Upload foto (direct to R2 via presigned URL)
4. Gallery pubblica con reactions + votes
5. Storage enforcement per tier (500MB free, 5GB Pro, 50GB Enterprise)
6. Stripe subscription upgrade
7. Dashboard con analytics base

## Funzionalità principali
- QR code generazione + download PDF/PNG
- Drag-drop multi-photo upload con progress
- Real-time gallery updates (Pusher)
- Reactions: ❤️ 😂 😮 😍 🔥
- Best photo voting
- Batch download ZIP
- Storage limit enforcement
- Stripe subscription management
- Collaborator invites (Pro/Enterprise)
- Analytics (views, downloads, engagement)

## Funzionalità future
- QR scan history
- Cold storage per eventi archiviati
- Email digest weekly
- Custom watermark upload
- White-label per wedding planners
- API pubblica

## Input
- Email, password per auth
- Event name, date, description, cover image
- Foto (jpg, png, heic, webp, max 20MB)
- Stripe token per upgrade

## Output
- QR code SVG/PNG/PDF
- Gallery link condivisibile
- Foto gallery con reactions
- Dashboard analytics
- Invoice da Stripe

## Flusso d'uso
1. Host si registra → crea evento → ottiene QR
2. Host condivide QR (stampa, WhatsApp, email)
3. Guest scansiona QR → apre gallery → carica foto senza account
4. Tutti vedono foto in real-time + reactions
5. Host gestisce (elimina foto, analytics, settings)

## Stack tecnico proposto
- Frontend: Next.js 14 (App Router) + TailwindCSS
- Backend: Next.js API Routes + tRPC
- Database: PostgreSQL (Neon) + Prisma
- Storage: Cloudflare R2 (S3-compatible)
- Auth: NextAuth.js v5
- Payments: Stripe
- QR: qrcode + sharp
- Email: Resend
- Real-time: Pusher

## Struttura iniziale progetto
```
/app
  /(auth)
    /signin
    /signup
  /(app)
    /dashboard
    /manage/[eventId]
    /settings
  /(public)
    /events/[eventId]
  /api
    /trpc/[trpc]
    /auth/[...nextauth]
    /webhooks/stripe
/components
  /ui (shadcn-like)
  /event
  /photo
  /qr
/lib
  /prisma.ts
  /auth.ts
  /stripe.ts
  /r2.ts
  /trpc.ts
/prisma
  /schema.prisma
```

## Requisiti visuali
- Stile: Modern editorial, trust-building, Linear/Notion-inspired
- Palette: Indigo primary (#4F46E5), Violet secondary (#7C3AED), Gold accent (#F59E0B)
- UI: Clean, spacious, confident — not playful
- Dashboard: Sidebar + main content grid
- Layout: Masonry per gallery, card grid per eventi

## Rischi o complessità
- R2 presigned URL flow complexity
- Real-time Pusher integration
- Stripe webhook handling (retry, idempotency)
- Storage calculation accuracy
- QR expiration logic

## Note
- Target: competere con Celebrate, PhotoMap, Koddak
- Differentiator: no watermark Pro, real-time, collaborative
- Timeline: MVP operativo in 2-3 sprint