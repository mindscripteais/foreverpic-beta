# TODO — ForeverPic (Beta)

## Stato Complessivo (2026-04-23)
Deploy su Vercel production: https://foreverpic-beta.vercel.app
Build OK. Upload fixato (server-side R2). Rimangono test end-to-end e polish.

## Fasi Completate
- [x] Setup Next.js 16 + Turbopack + Tailwind + tRPC + Prisma + Neon PostgreSQL
- [x] NextAuth v5 (OAuth Google + credentials)
- [x] Stripe (test mode) + webhook + checkout + tier enforcement
- [x] Cloudflare R2 storage + server-side upload API
- [x] Pusher real-time (photo added, reactions, votes)
- [x] Landing page italiana animata (7 sezioni)
- [x] Dashboard, event management, public gallery, manage page
- [x] QR code generation + download PNG/SVG
- [x] Photo upload con progress + server-side R2
- [x] Reactions, voting, lightbox, masonry grid
- [x] Auto-cancellazione 7gg (cron giornaliero)
- [x] GDPR cookie banner + /terms + /privacy
- [x] Admin dashboard nascosta (/beta-ops)
- [x] Social sharing (Web Share, WhatsApp, copy link)
- [x] Download protetto (solo owner)

## Post-Deploy TODO
- [ ] Test end-to-end: registrazione → creazione evento → upload foto → gallery pubblica
- [ ] Email welcome con Resend dopo registrazione
- [ ] Rate limiting API (tRPC + Next.js)
- [ ] Open Graph meta tags per social preview
- [ ] Copertina evento personalizzabile
- [ ] Stripe Price ID live (al momento Product ID in test)
- [ ] README.md completo
- [ ] Dark mode toggle
- [ ] Mobile responsive testing intensivo
- [ ] Polish UI finale (skeleton loaders, error boundaries)