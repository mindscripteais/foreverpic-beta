# TODO — EventShare

## Stato Complessivo (2026-04-23)
Fasi 1-9 completate. Build OK. Landing page animata completata.
Rimangono: README, dark mode, mobile testing intensivo, polish finale.

## Fase 1 — Setup & Config
- [ ] Inizializzare Next.js 14 con App Router
- [ ] Configurare TailwindCSS + design tokens
- [ ] Setup Prisma + schema database
- [ ] Configurare NextAuth v5
- [ ] Setup Stripe (test mode)
- [ ] Configurare Cloudflare R2 (presigned URLs)
- [ ] Setup tRPC

## Fase 2 — Auth
- [ ] Register page + API
- [ ] Signin page + API
- [ ] OAuth Google provider
- [ ] Protected routes middleware
- [ ] User profile page

## Fase 3 — Event Management
- [ ] Create event page + API
- [ ] List events dashboard
- [ ] Event detail/manage page
- [ ] Update event API
- [ ] Delete event API
- [ ] Collaborator invite system

## Fase 4 — QR Code
- [ ] QR generation API (qrcode library)
- [ ] QR download PNG
- [ ] QR download PDF (with template)
- [ ] QR expiration logic

## Fase 5 — Photo Upload
- [ ] Presigned URL API (R2)
- [ ] Client-side upload component
- [ ] Progress tracking
- [ ] EXIF strip (sharp)
- [ ] Thumbnail generation
- [ ] Storage limit enforcement
- [ ] Watermark overlay (free tier)

## Fase 6 — Gallery
- [ ] Public gallery page
- [ ] Masonry grid layout
- [ ] Lightbox viewer
- [ ] Reactions API + UI
- [ ] Best photo voting
- [ ] Infinite scroll pagination

## Fase 7 — Real-time
- [ ] Pusher setup
- [ ] Photo added events
- [ ] Reaction update events
- [ ] Live vote count

## Fase 8 — Dashboard & Analytics
- [ ] Dashboard page
- [ ] Event stats (views, photos, reactions)
- [ ] Storage usage indicator
- [ ] QR download stats

## Fase 9 — Stripe Subscription
- [ ] Pricing page
- [ ] Stripe Checkout integration
- [ ] Webhook handler (create, update, delete)
- [ ] Subscription status page
- [ ] Tier enforcement

## Fase 10 — Polish & Docs
- [ ] README.md completo
- [ ] Error handling full
- [ ] Loading states + skeletons
- [ ] Dark mode support
- [ ] Mobile responsive testing