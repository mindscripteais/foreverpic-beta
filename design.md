# Design Direction — ForeverPic

## Obiettivo visivo
"Candid Luxury" — Warm meets premium. Come entrare in un evento esclusivo. Warmth, calore, celebrazione — mai cheap o childish. Confidence in ogni pixel.

## Tono visivo
- Giovane ✓
- Moderno ✓
- Premium ✓
- Warm ✓
- Inviting ✓
- Celebratory ✓
- Professionale per B2B

## Palette colori

### Primary — Coral Sunset `#FF6B4A`
Energia, celebrazione, calore. Usato per CTAs primari, accent highlights.

### Secondary — Champagne Gold `#C9A96E`
Premium senza essere pacchiano. Usato per badges premium, dettagli eleganti.

### Base neutrals
| Role | Hex | Usage |
|------|-----|-------|
| Cream 100 | `#FAF8F5` | Page background |
| Warm 100 | `#F5F0E8` | Card backgrounds |
| Warm 200 | `#EDE6DB` | Subtle surfaces |
| Warm 300 | `#E5DCCD` | Borders, dividers |
| Charcoal | `#1A1A1A` | Primary text |
| Warm 500 | `#8A7A66` | Secondary text |

### Semantic
| Role | Hex |
|------|-----|
| Success | `#5DAE8A` |
| Warning | `#D4A84B` |
| Error | `#FF6B4A` |
| Info | `#6B9AC4` |

Dark mode: bg `#1A1A1A`, surface `#242424`, text `#FAF8F5`

## Tipografia
- **Headlines**: Fraunces (serif con personalità, non severo)
- **Body**: DM Sans (geometric ma friendly, non freddo come Inter)
- **Numeri/código**: Space Mono (technical ma con carattere)

## Layout
- Header: Logo left, nav center, user avatar right (sticky)
- Sidebar: Collapsible, 272px width (68 units), nav items + tier badge
- Dashboard: 3-col grid (desktop), 2-col (tablet), 1-col (mobile)
- Form: Single column, labels top, 8px gap, 16px section gap
- Card: 12px radius, soft shadow, hover lift con scale
- Modali: 20px radius, backdrop blur, centered

## Regole visive
- Spaziatura: base 4px, scale 4/8/12/16/24/32/48/64
- Ombre: soft only (0 2px 8px rgba(26,26,26,0.06))
- Bordi: 1px solid warm-300/40 for dividers
- Contrasti: WCAG AA minimum (4.5:1 text, 3:1 UI)
- Gerarchia: size + weight + color, never just color
- Animazioni: fade-in, slide-up, scale-in con timing naturale

## UX notes
- Azioni principali: coral button con glow shadow
- CTAs: gold accent per upgrade prompts
- Empty states: warm illustration + clear CTA
- Loading: spinner coral, non shimmers dove possibile
- Error: coral inline, non modali bloccanti

## Componenti core
1. EventCard — dashboard event grid
2. PhotoGrid — masonry gallery
3. QRUploader — generate + download QR
4. UploadZone — drag-drop multi-file
5. ReactionBar — emoji reactions
6. TierBadge — tier indicator
7. StorageIndicator — usage bar
