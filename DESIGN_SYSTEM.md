# Udarsy Design System

> Reference for all UI/UX decisions. Read this before creating or modifying any component.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-green` | `#3aaa6a` | Primary brand, buttons, accents, borders |
| `--color-dark` | `#1a3a2a` | Headings, body text |
| `--color-bg` | `#e4e8e3` | Page backgrounds (rare) |
| White | `#ffffff` | Cards, surfaces |
| Green light 1 | `#f0faf5` | Card header backgrounds |
| Green light 2 | `#e8f5ee` | Gradient end, hover states |
| Green light 3 | `#d4eddf` | Done/completed states |
| Green dark | `#1e7a46` | Dark green panels, CTAs |
| Green darkest | `#0f4428` | Gradient ends |
| Green muted | `rgba(58,170,106,0.11)` | Default card borders |
| Green hover | `rgba(58,170,106,0.35)` | Hover card borders |
| Green glow | `rgba(58,170,106,0.14)` | Hover box-shadow tint |
| Skeleton base | `#f3f4f3` | Shimmer start/end |
| Skeleton shine | `#eaf2ed` | Shimmer midpoint |

### Green Scale (opacity variants)
```
rgba(58, 170, 106, 0.04)  — subtle background tint
rgba(58, 170, 106, 0.07)  — chip backgrounds
rgba(58, 170, 106, 0.10)  — icon backgrounds, progress tracks
rgba(58, 170, 106, 0.11)  — default card borders
rgba(58, 170, 106, 0.14)  — hover glow shadow
rgba(58, 170, 106, 0.16)  — hover icon backgrounds
rgba(58, 170, 106, 0.18)  — dot texture
rgba(58, 170, 106, 0.28)  — done-state borders
rgba(58, 170, 106, 0.35)  — hover borders
rgba(58, 170, 106, 0.50)  — muted labels
rgba(58, 170, 106, 0.60)  — stat text
rgba(58, 170, 106, 0.75)  — chip text
#3aaa6a                   — full green (icons, fills, badges)
```

---

## Typography

- **Font:** Cairo (variable font, loaded via Next.js `next/font`)
- **Font family fallback:** `var(--font-cairo), sans-serif`
- **Text direction:** LTR default, RTL when `locale === 'ar'`

### Mobile-first type scale

| Role | px range | Mobile (base) | Desktop |
|------|----------|---------------|---------|
| Large display / hero | 32–48px | `text-3xl` (30px) | `md:text-5xl lg:text-7xl` |
| Page title | 24–32px | `text-2xl` (24px) | `md:text-4xl` |
| Section heading | 20–24px | `text-xl` (20px) | `md:text-2xl` |
| Subheading | 18–20px | `text-lg` (18px) | `md:text-xl` |
| Body text | 16px | `text-base` | — |
| Secondary body | 14–15px | `text-sm` | — |
| Caption / helper | 12–13px | `text-xs` | — |
| Tiny labels | 10–11px | `text-[10px]`–`text-[11px]` | — |

**Rules:**
- Minimum body text is **16px** (`text-base`) — never use `text-sm` for paragraph copy
- Line height: `leading-relaxed` (1.625) for body, `leading-tight` (1.25) for headings
- Minimum tap target: **44×44px** — buttons and interactive elements must meet this
- Never use bare `text-5xl`, `text-6xl`, `text-7xl` without a mobile prefix (`text-3xl md:text-5xl …`)

### Scale used in components
| Role | Size | Weight |
|------|------|--------|
| Page title | `text-2xl md:text-4xl` | `font-black` (900) |
| Section heading | `text-xl md:text-2xl` | `font-black` (900) |
| Section subtext | `text-sm` | `font-normal` (400), muted `rgba(26,58,42,0.4)` |
| Card title | `0.88–0.9rem` | `font-bold` (700) |
| Service card title | `text-sm` (14px) | `font-bold` (700) |
| Service card desc | `text-xs` (12px) | `font-normal` (400), muted |
| Badge / chip | `0.58–0.68rem` | `font-bold`–`font-extrabold` (700–800) |
| Label / stat | `0.62–0.65rem` | `font-bold` (700) |
| Body / desc | `text-sm`–`text-base` | `font-medium`–`font-normal` |
| Kicker / eyebrow | `text-xs` uppercase `tracking-widest` | `font-black` (900) |

---

## Shadows

```css
/* Card resting */
box-shadow: 0 2px 10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);

/* Card hover */
box-shadow: 0 10px 28px rgba(58,170,106,0.14), 0 3px 10px rgba(58,170,106,0.08);

/* Card active (design token) */
box-shadow: 0 0 0 2.5px #3aaa6a, 0 6px 24px rgba(58,170,106,0.25);

/* Icon done state */
box-shadow: 0 4px 12px rgba(58,170,106,0.3);

/* Panel / modal */
box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
```

---

## Border Radius

| Usage | Value |
|-------|-------|
| Cards | `18px` |
| Large panels / modals | `24px`–`40px` |
| Buttons | `12px`–`14px` |
| Icon boxes | `11px`–`14px` |
| Chips / badges / pills | `999px` (full round) |
| Progress bars | `999px` |
| Skeleton loaders | `18px` (match card) |

---

## Animations

### Entry — `fadeSlideUp`
All cards, lists, panels enter with this animation.
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translate3d(0, 18px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
/* Usage: animation: fadeSlideUp 0.35s ease-out both; */
/* Stagger with: style={{ animationDelay: `${index * 40}ms` }} */
```

### Entry — `slide-up` (panels/pages)
```css
@keyframes slide-up {
  from { opacity: 0; transform: translate3d(0, 24px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
/* Usage: className="animate-slide-up" */
/* Duration: 0.3s cubic-bezier(0.16, 1, 0.3, 1) */
```

### Skeleton Shimmer
```css
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
background: linear-gradient(90deg, #f3f4f3 0%, #eaf2ed 40%, #f3f4f3 80%);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;
```

### Card Hover Lift
```css
transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.28s ease,
            border-color 0.28s ease;
/* On hover: transform: translate3d(0, -5px, 0); */
/* On active: transform: translate3d(0, -2px, 0); transition-duration: 0.12s; */
```

### Contour Border (cards) — fills from both sides meeting at center
```css
/* Uses ::before (left→center) and ::after (right→center) — no extra HTML needed */
.card::before,
.card::after {
  content: '';
  position: absolute;
  top: 0;
  height: 3px;
  width: 50%;
  transform: scaleX(0);
  transition: transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
  z-index: 2;
}
.card::before { left: 0;  transform-origin: left;  background: linear-gradient(90deg, #3aaa6a, #5dc98a); }
.card::after  { right: 0; transform-origin: right; background: linear-gradient(90deg, #5dc98a, #3aaa6a); }
.card:hover::before,
.card:hover::after,
.card-done::before,
.card-done::after { transform: scaleX(1); }
```

### Float (decorative elements)
```css
@keyframes float {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%       { transform: translate3d(0, -10px, 0); }
}
/* Duration: 3s ease-in-out infinite */
```

### Slow Spin
```css
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
/* Duration: 8s linear infinite */
```

### Fan Draw (SVG lines)
```css
@keyframes fanDraw {
  to { stroke-dashoffset: 0; }
}
/* stroke-dasharray: 450; stroke-dashoffset: 450 → animates to 0 */
/* Duration: 2.2s cubic-bezier(0.22, 1, 0.36, 1) */
```

### Easing Reference
| Purpose | Curve |
|---------|-------|
| Card hover lift (springy) | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Accent bar grow | `cubic-bezier(0.34, 1.2, 0.64, 1)` |
| Progress fill | `cubic-bezier(0.34, 1.2, 0.64, 1)` |
| Page entrance | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Quick press/active | `0.12s` linear |
| Color/opacity transitions | `0.2s ease` |

---

## Glassmorphism

```css
/* Light glass */
.glass {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.3);
}

/* Dark glass */
.glass-dark {
  background: rgba(26,58,42,0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
}
```

---

## Card Anatomy

Every card follows this exact structure:

```
┌─────────────────────────────┐  ← border: 1.5px solid rgba(green, 0.11)
│ [accent bar — 3px, scaleX]  │  ← slides in on hover from left
│─────────────────────────────│
│ [icon area]   [arrow/ring]  │  ← bg: linear-gradient(135deg, #f0faf5, #e8f5ee)
│  dot texture overlay        │  ← radial-gradient dots 14px grid
│─────────────────────────────│
│ [title — 2 lines max]       │  ← -webkit-line-clamp: 2
│ [chips / meta]              │
│ [progress bar — 3px track]  │  ← pushed to bottom with margin-top: auto
└─────────────────────────────┘
  border-radius: 18px
  box-shadow: resting → hover (green glow)
```

### States
| State | Border | Background | Accent |
|-------|--------|------------|--------|
| Default | `rgba(green, 0.11)` | `#fff` | hidden |
| Hover | `rgba(green, 0.35)` | `#fff` | visible |
| Done | `rgba(green, 0.28)` | `linear-gradient(145deg, #fff, #f3faf6)` | always visible |

---

## Dot Texture Pattern

Used on card icon areas and decorative sections:
```css
background-image: radial-gradient(circle, rgba(58,170,106,0.18) 1px, transparent 1px);
background-size: 14px 14px;
```

---

## Dark Green Panel (CTA/Login banners)

```css
background: linear-gradient(135deg, #1e7a46 0%, #0f4428 100%);
/* + diagonal stripe texture: */
backgroundImage: `repeating-linear-gradient(
  45deg,
  rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px,
  transparent 2px, transparent 8px
), linear-gradient(135deg, #1e7a46 0%, #0f4428 100%)`
```

---

## Skeleton Loaders

Always match the shape of the real component:
```css
.skeleton {
  height: [match real component height];
  border-radius: [match real component radius];
  background: linear-gradient(90deg, #f3f4f3 0%, #eaf2ed 40%, #f3f4f3 80%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite, fadeSlideUp 0.3s ease-out both;
}
```

---

## Buttons

### Primary (green fill)
```css
bg-green text-white font-bold rounded-xl px-5 py-2
hover:bg-green/90 transition-colors
```

### Ghost / outline
```css
border border-green/20 text-green font-semibold rounded-xl px-4 py-2
hover:border-green hover:bg-green/5 transition-all
```

### Back button — `.btn-back`
Pill-shaped ghost button used for all back/return navigation. Arrow slides on hover.
```css
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(58, 170, 106, 0.5);
  padding: 7px 14px 7px 11px;
  border-radius: 999px;
  border: 1.5px solid rgba(58, 170, 106, 0.15);
  background: transparent;
  transition: color 0.22s, border-color 0.22s, background 0.22s,
              gap 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.btn-back:hover {
  color: #3aaa6a;
  border-color: rgba(58, 170, 106, 0.35);
  background: rgba(58, 170, 106, 0.05);
  gap: 10px;
}
.btn-back-arrow { transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.btn-back:hover .btn-back-arrow { transform: translateX(-3px); }
.btn-back.rtl:hover .btn-back-arrow { transform: translateX(3px); }
```
Usage: `<Link href="..." className="btn-back"><ArrowLeft className="btn-back-arrow" />{label}</Link>`

### Sign In button — `.btn-signin`
White pill used **only inside dark green panels**. Lifts on hover.
```css
.btn-signin {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #1a6b3a;
  background: #ffffff;
  border-radius: 999px;
  padding: 7px 18px;
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
}
.btn-signin:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 8px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1);
}
.btn-signin:active { transform: scale(0.95); }
```
Usage: `<button className="btn-signin"><LogIn size={13} />Sign In</button>`

### Service Card grid — `.svc-card` / `.svc-icon`
Grid tiles on the profile page. Unified green-only hover. Icons keep accent colors but card hover is always green.
```css
.svc-card {
  display: flex; flex-direction: column; gap: 14px; padding: 20px 18px;
  border-radius: 20px; background: #fff;
  border: 1.5px solid rgba(58,170,106,0.09);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: border-color 0.2s, box-shadow 0.22s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
}
/* Top accent bar from left on hover */
.svc-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background: linear-gradient(90deg, #3aaa6a, #5dc98a);
  transform:scaleX(0); transform-origin:left;
  transition: transform 0.3s cubic-bezier(0.34,1.2,0.64,1); }
.svc-card:hover::before { transform: scaleX(1); }
.svc-card:hover { border-color: rgba(58,170,106,0.22); box-shadow: 0 8px 24px rgba(58,170,106,0.1); transform: translateY(-3px); }
.svc-icon { width:46px; height:46px; border-radius:14px; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s; }
.svc-card:hover .svc-icon { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
```
- Icon size: `22px`
- Title: `text-sm font-bold text-dark`
- Description: `text-xs` muted `rgba(26,58,42,0.38)`
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Locked variant: `opacity-60` + `cursor-not-allowed`, overlay full-inset `<Link>` for redirect

### Continue Learning Card — `.continue-card`
Subject card anatomy applied to a "resume session" card. Dot-texture icon header + progress bar footer + full-perimeter contour on hover.
```css
/* See globals.css — .continue-card */
/* Same clip-path contour technique as lesson cards */
```
Usage: `<Link href="..." className="continue-card group">`

### List item buttons (navigation / selection)
```css
group flex items-center justify-between p-5 rounded-2xl
bg-gray-50/50 border border-transparent
hover:border-green hover:bg-white hover:shadow-xl
transition-all duration-200 animate-slide-up
```
Chevron: `text-gray-300 group-hover:text-green group-hover:translate-x-1 transition-all`

### Save / Favorite button
Used in the lesson header. Pill-shape, green ghost when unsaved, soft red ghost when saved.
```tsx
// Unsaved state
style={{ padding:'8px 18px', background:'rgba(58,170,106,0.07)', border:'1.5px solid rgba(58,170,106,0.18)' }}
className="group flex items-center gap-2 rounded-full font-bold text-sm text-green active:scale-95"

// Saved state
style={{ padding:'8px 18px', background:'rgba(239,68,68,0.07)', border:'1.5px solid rgba(239,68,68,0.18)' }}
className="... text-red-500"
```
Icon: `<Heart size={16} className={isFavorite ? "fill-current" : ""} />`

---

## Navigation Patterns

### Navbar icons (Lucide)
| Route | Icon | Why |
|-------|------|-----|
| `/` Home | `House` | Filled-style house, more modern than `Home` |
| `/explore` | `LayoutGrid` | Grid = browse/explore, more intuitive |
| `/news` | `BookOpen` | Content/reading context |
| `/profile/chat` | `MessageCircle` | Rounder, more modern than `MessageSquare` |
| `/calendar` | `CalendarDays` | Keeps days detail |
| Profile / auth | `User` / photo | Default user silhouette |

### Step-by-step wizard (school → level → guidance)
- Each step re-animates the container with `key={step}` + `animate-slide-up`
- Back button: use `.btn-back` class with `ChevronLeft` + `.btn-back-arrow`
- Auto-advance: if only 1 option, call `onSelect` immediately (skip the step)
- Stagger list items: `animationDelay: ${index * 40}ms`

### Back navigation
- Desktop: always show `← Back to Subjects` link at top of content using `.btn-back`
- Mobile: show in bottom safe area or at top with `hidden md:block` header
- RTL: add `.rtl` modifier class + `flex-row-reverse` on the container, `rotate-180` on the icon

### Breadcrumbs / progress steps
- Use small dots or numbered indicators for multi-step flows
- Active step: full green dot; past steps: green/50; future: gray

---

## RTL Support

Always apply `flex-row-reverse` on flex containers when `isAr`:
```tsx
const isAr = locale === 'ar';
<div className={`flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
```
Arrow icons: `<ArrowLeft className={isAr ? 'rotate-180' : ''} />`

---

## Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(58,170,106,0.2);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover { background: rgba(58,170,106,0.4); }
```

---

## Accessibility

- `prefers-reduced-motion`: all animations set to `0.01ms` duration
- `pointer-events: none` on all decorative elements (blobs, textures, bg numbers)
- `user-select: none` on decorative text (bg numbers)
- `will-change: transform` only on animated elements, not static ones

---

## Performance Rules

1. **GPU compositing only** — all animations use `transform` and `opacity`, never `top/left/width/height`
2. `transform: translateZ(0)` on cards to force GPU layer
3. `will-change: transform` on cards with hover animations
4. Decorative blobs use `translate3d(x%, y%, 0)` not absolute positioning changes
5. `backdrop-filter` used sparingly (expensive) — only for glass effects where needed
6. SVG animations use `stroke-dashoffset` (composited) not fill changes
