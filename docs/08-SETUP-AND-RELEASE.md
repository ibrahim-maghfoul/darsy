# Darsy — Setup & Release Guide

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 6+ (local or Atlas)
- Docker (for N8N)
- ngrok (for N8N 2.14+ webhooks)

---

## Environment Variables

### Backend — `darsy-backend/.env`

```
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://localhost:27017/darsy

# JWT
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true

# Cookies
COOKIE_SECRET=change-me-cookie
COOKIE_MAX_AGE=2592000000   # 30 days

# Email (Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM="Darsy <noreply@darsy.app>"

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Internal API key (scraper / bulk-upsert)
API_KEY=...

# Poster / LLM providers (optional — admin panel sends keys from UI too)
OPENAI_API_KEY=...
NEBIUS_API_KEY=...
OPENROUTER_API_KEY=...
GEMINI_API_KEY=...
```

### Frontend — `darsy-web/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

### Admin — `darsy-admin/.env`

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

(Admin also reads AI provider keys from `darsy-backend/keys.json` via the Poster route; keep that file out of source control.)

---

## First-time Setup

```bash
# 1. Clone and install all projects
cd darsy-backend && npm install
cd ../darsy-web && npm install
cd ../darsy-admin && npm install

# 2. Seed MongoDB (optional) — use darsy-backend/scripts/seed-*.ts helpers

# 3. Ensure uploads directories exist
mkdir -p darsy-backend/data/{images,resources,videos,documents,verifications,posters}
```

---

## Running Locally

Use the helper scripts in `darsy-servers/`:

```bash
# Start everything
darsy-servers/start-backend.cmd
darsy-servers/start-web.cmd
darsy-servers/start-admin.cmd

# Kill all
darsy-servers/"kill all servers.cmd"
```

Or manually:

```bash
cd darsy-backend && npm run dev       # port 5000
cd darsy-web && npm run dev           # port 3000
cd darsy-admin && npm run dev         # port 5173
```

Health check: `GET http://localhost:5000/health` → `{ status: "ok" }`.

---

## Production Build

```bash
# Backend
cd darsy-backend
npm run build
npm run start

# Frontend
cd darsy-web
npm run build
npm run start    # Next.js production server

# Admin
cd darsy-admin
npm run build
# serve ./dist via any static host
```

---

## Static file directory

Backend serves uploads from `data/`:

| URL                        | Disk path                                 |
|----------------------------|-------------------------------------------|
| `/data/images/...`         | `darsy-backend/data/images/`              |
| `/data/resources/...`      | `darsy-backend/data/resources/`           |
| `/data/videos/...`         | `darsy-backend/data/videos/`              |
| `/data/documents/...`      | `darsy-backend/data/documents/`           |
| `/data/verifications/...`  | `darsy-backend/data/verifications/`       |
| `/data/posters/...`        | `darsy-backend/data/posters/` (no cache)  |

Cache: `maxAge: 7d` for everything except posters (0).

---

## N8N

See [07-N8N-WORKFLOWS.md](07-N8N-WORKFLOWS.md) for the full workflow catalog.
Boot sequence each session:

```bash
ngrok http 5678
# copy public URL, then:
docker rm -f n8n
docker run -d --name n8n -p 5678:5678 \
  -e WEBHOOK_URL=https://NEW_URL/ \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Inside workflows, MongoDB connection host must be `host.docker.internal`, not `localhost`.

---

## Release Checklist

### Code
- [ ] Run `npm run typecheck` / `tsc --noEmit` in backend, admin, web.
- [ ] `npm run lint` across all three projects.
- [ ] `npm run build` succeeds in all three.
- [ ] All feature flags removed from temporary toggles.

### Secrets & Config
- [ ] `.env` files not committed (`darsy-backend/keys.json` is gitignored).
- [ ] Prod `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` rotated.
- [ ] Telegram bot token regenerated (previous value was exposed).
- [ ] Google OAuth redirect URIs match prod domain.
- [ ] CORS origin set to prod domain.

### Infra
- [ ] MongoDB backups scheduled.
- [ ] `data/` directory mounted on persistent volume.
- [ ] Rate-limit config sized for prod traffic.
- [ ] Helmet CSP reviewed (images/https/data:).
- [ ] HTTPS enforced; signed cookies `secure: true` in prod.

### Content
- [ ] Seed curriculum (schools/levels/guidances/subjects) imported.
- [ ] Global calendar events present (auto-seeds on first `/calendar/global` call if empty).
- [ ] News scraper cron configured with `API_KEY`.

### Monetization
- [ ] Payment provider hooked to `/api/user/subscribe`.
- [ ] Subscription expiry job running.
- [ ] Affiliate referral bonus (+3 premium days) verified end-to-end.

### Admin
- [ ] At least one `admin` role user exists.
- [ ] AI provider keys loaded in `keys.json`.
- [ ] Approval flows (contributions, teacher apps, verifications, instructor courses) tested.

### Monitoring
- [ ] Error logging (beyond console) wired up.
- [ ] Health-check pinged by uptime monitor.
- [ ] Socket.io connection counts tracked.

---

## Source of Truth

- Tech decisions live in this repo — no external wiki.
- Project-wide reference: [`CLAUDE.md`](../CLAUDE.md) (root of workspace).
- Function-level reference: this `docs/` folder.
- Design system: [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).
- High-level pitch: [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md).
- Marketing setup: [`SOCIAL_MEDIA_SETUP.md`](../SOCIAL_MEDIA_SETUP.md).
