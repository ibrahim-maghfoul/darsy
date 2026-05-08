# Udarsy — Project Overview

## What Udarsy Is

Udarsy is a full-stack educational platform for Moroccan students (Secondary school, BAC prep, Brevet).
It combines a curriculum browser, real-time chat, teacher/instructor systems, news, contributions
hub, calendar, and a marketing automation backend.

- Market: Morocco
- Languages: Arabic (Darija + MSA), French, English (RTL for Arabic)
- Currency: MAD (Moroccan Dirham)
- Monetization: Freemium — Free / Pro (100 MAD/mo, 900 MAD/yr) / Premium (200 MAD/mo, 1900 MAD/yr)

## Repository Layout

```
Udarsy/
├── udarsy-web/          # Next.js 16 frontend (main website)
├── udarsy-backend/      # Node.js + Express API (TypeScript)
├── udarsy-admin/        # React 19 + Vite admin panel
├── udarsy-marketing/    # Marketing assets + N8N workflows
│   └── n8n/            # 27 pre-built automation workflows
└── udarsy-inspirations/ # Design references
```

## High-Level Tech Stack

| Layer       | Stack                                                               |
|-------------|---------------------------------------------------------------------|
| Frontend    | Next.js 16 (App Router), React 19, TypeScript, Tailwind, next-intl  |
| Backend     | Node.js, Express, TypeScript, Mongoose, Socket.io                   |
| Database    | MongoDB (Mongoose with connection pooling, maxPoolSize=10)          |
| Auth        | JWT (access + refresh) + Google OAuth + bcrypt                      |
| Email       | Nodemailer                                                          |
| File Store  | Local `/data/*` + optional Firebase sync                            |
| Security    | Helmet, CORS, rate-limiting, input sanitization, magic-byte check   |
| Admin       | React 19 + Vite + React Router (lazy routes)                        |
| Realtime    | Socket.io rooms by guidance+level                                   |
| i18n        | `ar`, `fr`, `en` via next-intl                                      |
| Automations | N8N (Docker, port 5678) — 27 workflows                              |

## Ports

- Backend: `5000`
- Admin: Vite default (5173)
- Web: Next.js default (3000)
- N8N: 5678

## User Roles

`user` → `teacher` → `instructor` → `admin`

## Subscription Plans

| Plan    | Monthly  | Yearly    | Key Features                                  |
|---------|----------|-----------|-----------------------------------------------|
| Free    | 0        | 0         | Basic lessons, 10 offline downloads           |
| Pro     | 100 MAD  | 900 MAD   | Premium lessons, no ads, 100 downloads        |
| Premium | 200 MAD  | 1900 MAD  | Full access, unlimited downloads, priority    |

## Running the Project (Quick)

```
# Backend
cd udarsy-backend && npm run dev    # port 5000

# Frontend
cd udarsy-web && npm run dev        # port 3000

# Admin
cd udarsy-admin && npm run dev      # port 5173

# N8N
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

See `docs/08-SETUP-AND-RELEASE.md` for full environment + release steps.

## Document Index

- `01-OVERVIEW.md` — this file
- `02-BACKEND.md` — every controller, route, middleware, util, socket
- `03-FRONTEND.md` — every page, service, context, lib in udarsy-web
- `04-ADMIN.md` — every admin page, route, utility
- `05-DATABASE-MODELS.md` — complete Mongoose schemas
- `06-API-REFERENCE.md` — every endpoint with params + auth
- `07-N8N-WORKFLOWS.md` — all 27 marketing/engagement workflows
- `08-SETUP-AND-RELEASE.md` — env vars, local setup, release checklist
