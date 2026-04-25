# ForeverPic

**ForeverPic** è una piattaforma per raccogliere e condividere foto di eventi via QR code. Gli ospiti scansionano, caricano e le foto appaiono in tempo reale nella galleria condivisa.

🚀 **Beta live**: https://foreverpic-beta.vercel.app

---

## Cosa fa

- **Crea eventi** in pochi secondi con nome, data e privacy
- **Genera QR code** da stampare o condividere digitalmente
- **Carica foto** da mobile/desktop drag-and-drop con progresso
- **Galleria live** con masonry grid, lightbox, reazioni e voti
- **Download** di tutte le foto come ZIP (solo proprietario)
- **Real-time** via WebSocket — le foto appaiono istantaneamente
- **Social sharing** (WhatsApp, copy link, Web Share API)

---

## Tech Stack

| Layer | Tecnologia |
|-------|-----------|
| Framework | Next.js 16 (App Router) + Turbopack |
| Styling | Tailwind CSS |
| API | tRPC |
| Auth | NextAuth v5 (Google OAuth + Credentials) |
| Database | PostgreSQL (Neon) + Prisma |
| Storage | Cloudflare R2 |
| Real-time | Pusher |
| Payments | Stripe (test mode) |
| Email | Resend |
| Deploy | Vercel |

---

## Avvio locale

### Prerequisiti

- Node.js 20+
- PostgreSQL (o Neon DB)
- Account Cloudflare R2
- Account Stripe (test)
- Account Pusher
- Account Resend

### Setup

```bash
# 1. Clona il repo
git clone https://github.com/mindscripteais/foreverpic-beta.git
cd foreverpic-beta

# 2. Installa dipendenze
npm install

# 3. Configura env
cp .env.example .env.local
# Modifica .env.local con le tue credenziali

# 4. Genera Prisma client
npx prisma generate

# 5. Applica migration
npx prisma migrate deploy

# 6. Avvia dev server
npm run dev
```

### Env vars necessarie

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="foreverpic-beta"
R2_PUBLIC_URL="https://pub-XXXX.r2.dev"

# Stripe (test)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRODUCT_ID="prod_..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="..."

# Resend
RESEND_API_KEY="re_..."

# Cron (auto-cleanup)
CRON_SECRET="your-cron-secret"
```

---

## Struttura progetto

```
app/
  (app)/           # Route group protette (dashboard, manage, settings)
  (auth)/          # Route group auth (signin, signup)
  (public)/        # Route group pubbliche (events/[eventId])
  api/             # API routes (auth, upload, cron, webhooks)
  page.tsx         # Landing page
  layout.tsx       # Root layout + metadata
components/
  photo/           # UploadZone, PhotoGrid, PhotoLightbox
  event/           # EventCard, CreateEventModal
  qr/              # QRUploader
  layout/          # Sidebar
  ui/              # Button, Progress, Modal, CookieBanner
lib/
  auth.ts          # NextAuth config
  prisma.ts        # Prisma client singleton
  trpc.ts          # tRPC router + procedures
  router/          # tRPC routers (event, photo, user, admin)
  r2.ts            # Cloudflare R2 client
  email.ts         # Resend email helpers
  rate-limit.ts    # In-memory rate limiter
  stripe.ts        # Stripe client
  pusher.ts        # Pusher server/client
prisma/
  schema.prisma    # Database schema
```

---

## Beta notes

- **Tutti gli eventi** si auto-cancellano dopo **7 giorni**
- **Stripe è in test mode** — i pagamenti non sono reali
- **Admin dashboard**: `/beta-ops` (visibile solo a `isAdmin=true`)
- **Rate limiting**: in-memory (per beta), da sostituire con Redis in produzione
- **Storage tiers**: Free 500MB/evento, Pro 5GB, Enterprise 50GB

---

## Roadmap

- [x] Upload foto server-side (CORS-free)
- [x] Real-time gallery
- [x] QR code generation
- [x] Social sharing
- [x] Download ZIP
- [x] GDPR cookie banner + ToS/Privacy
- [x] Admin dashboard
- [x] Email di benvenuto
- [x] Rate limiting
- [x] Open Graph meta
- [ ] Copertina evento personalizzabile
- [ ] Stripe live mode
- [ ] Dark mode toggle
- [ ] Analytics avanzate

---

## Licenza

MIT
