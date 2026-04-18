# Darsy — Full Project Description

## Overview

**Darsy** is a comprehensive, full-stack educational platform built for Moroccan students (secondary school, BAC prep, and Brevet levels). It delivers curriculum-aligned learning content in Arabic (Darija + MSA), French, and English, with real-time interaction, teacher and instructor systems, marketing automation, and a full admin control panel.

---

## Scale at a Glance

| Dimension | Count |
|-----------|-------|
| Sub-projects / apps | 4 |
| Backend TypeScript source files | ~54 |
| Frontend pages (Next.js routes) | 34 |
| Admin panel pages | 19 |
| Admin source files | 30 |
| MongoDB models | 20+ |
| REST API endpoints | 70+ |
| N8N marketing workflows | 27 (33 JSON files) |
| Supported languages | 3 (AR, FR, EN) |
| User roles | 4 (user → teacher → instructor → admin) |
| Subscription tiers | 3 (Free / Pro / Premium) |

---

## Repository Structure

```
Darsy/
├── darsy-web/           # Next.js 16 — main user-facing website
├── darsy-backend/       # Node.js + Express (TypeScript) — REST API + Socket.io
├── darsy-admin/         # React 19 + Vite — internal admin panel
├── darsy-marketing/     # N8N automation workflows + marketing assets
│   └── n8n/
│       ├── workflows/   # 33 pre-built n8n workflow JSON files
│       └── docs/        # Setup guides per workflow category
└── darsy-inspirations/  # Design references and UI inspiration
```

---

## 1. Frontend — `darsy-web`

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, SCSS modules

### All 34 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, course previews, live chat demo, team, pricing |
| `/explore` | Curriculum browser — select school / level / guidance / subject |
| `/explore/subject/[subjectId]` | Subject page with lesson cards |
| `/lesson/[lessonId]` | Lesson player — PDFs, videos, exercises, exams, progress tracking |
| `/lesson/[lessonId]/preview` | Public lesson preview (no auth required) |
| `/news` | News grid with pagination |
| `/news/[id]` | Article detail — Q&A thread, star ratings, view tracking |
| `/contact` | Contact form — sends email to admin + auto-reply to user |
| `/download` | Resource download hub |
| `/contributions` | Contribution hub — submit resources, leaderboard, stats |
| `/profile` | User profile — stats, avatar, settings, logged lessons |
| `/profile/chat` | Real-time Socket.io chat interface |
| `/teacher` | Browse public teacher directory |
| `/teacher/[id]` | Teacher profile — bio, ratings, classroom rooms |
| `/teacher/dashboard` | Teacher dashboard — manage rooms, invites, profile |
| `/instructor/[id]` | Instructor profile — courses, ratings, download stats |
| `/instructor-dashboard` | Instructor dashboard — upload and manage courses |
| `/apply-instructor` | Multi-step instructor application form |
| `/apply-teacher` | Teacher verification — document submission |
| `/calendar` | Interactive calendar — global + personal events, todos |
| `/report` | Bug/feedback submission form |
| `/pricing` | Subscription plans and pricing page |
| `/about` | About page |
| `/services` | School services directory |
| `/services/[id]` | Service detail page |
| `/privacy` | Privacy policy |
| `/login` | Login page (email + Google OAuth) |
| `/signup` | Registration page |
| `/onboarding` | New user onboarding flow |
| `/settings` | Account settings |
| `/grades-calculator` | Grade calculator tool |
| `/favorites/courses` | Saved/favorite lessons |
| `/favorites/news` | Saved news articles |
| `/instructors` | Browse all instructors |
| `/design-test` | Internal UI/design testing (not production) |

### Key Frontend Architecture

- **API client:** `darsy-web/src/lib/api.ts`
- **Auth context:** `darsy-web/src/contexts/AuthContext.tsx`
- **Data services:** `darsy-web/src/services/data.ts`, `progress.ts`
- **i18n messages:** `darsy-web/messages/ar.json`, `en.json`, `fr.json`
- **Caching:** `darsy-web/src/lib/cache.ts`
- **Constants:** `darsy-web/src/lib/constants.ts`
- **Page transitions:** `darsy-web/src/components/PageTransition.tsx`

---

## 2. Backend — `darsy-backend`

**Stack:** Node.js, Express, TypeScript, Mongoose, Socket.io, JWT, bcryptjs, Nodemailer, Helmet, CORS, rate limiting

**Port:** `5000` | **API base:** `http://localhost:5000/api`

### File Structure

```
darsy-backend/src/
├── server.ts                  # Entry point — Express + Socket.io init
├── config/
│   ├── index.ts               # Environment variables
│   └── database.ts            # MongoDB connection
├── controllers/               # 8 controllers
│   ├── authController.ts
│   ├── calendarController.ts
│   ├── dataController.ts
│   ├── instructorController.ts
│   ├── newsController.ts
│   ├── progressController.ts
│   ├── teacherController.ts
│   └── userController.ts
├── middleware/                # 4 middleware modules
│   ├── auth.ts                # JWT verification
│   ├── errorHandler.ts
│   ├── security.ts            # Helmet, CORS, rate limiting, sanitization
│   └── upload.ts              # Multer file upload handling
├── models/                    # 20 Mongoose models
│   ├── User.ts
│   ├── School.ts, Level.ts, Guidance.ts, Subject.ts, Lesson.ts
│   ├── News.ts, NewsQuestion.ts
│   ├── Contribution.ts
│   ├── Feedback.ts, Report.ts, UserReport.ts
│   ├── TeacherApplication.ts, TeacherProfile.ts
│   ├── TeacherRoom.ts, TeacherVerification.ts
│   ├── InstructorCourse.ts, InstructorRating.ts
│   ├── ChatRoom.ts, Message.ts
│   ├── GlobalEvent.ts
│   ├── Newsletter.ts
│   └── SchoolService.ts
├── routes/                    # 12 route files
│   ├── auth.ts, user.ts, data.ts, progress.ts
│   ├── news.ts, newsletter.ts, contact.ts
│   ├── teacher.ts, instructor.ts
│   ├── chat.ts, calendar.ts
│   └── poster.ts
├── sockets/
│   └── chat.ts                # Socket.io real-time chat logic
└── utils/
    ├── auth.ts                # JWT helpers
    ├── cache.ts               # In-memory caching layer
    └── email.ts               # Nodemailer email service
```

### API Surface (70+ endpoints across 10 route groups)

| Route Group | Key Actions |
|-------------|-------------|
| `/api/auth` | Register, login, Google OAuth, logout, token refresh |
| `/api/user` | Profile CRUD, subscriptions, bug reports, contribution limits, admin feedback management |
| `/api/progress` | Track views, update learning time, mark complete, favorites, per-subject/lesson stats |
| `/api/data` | Full curriculum hierarchy (schools → lessons), stats, contributions, school services |
| `/api/news` | CRUD articles, ratings, Q&A threads |
| `/api/newsletter` | Subscribe, subscriber count |
| `/api/contact` | Contact form → email |
| `/api/chat` | Chat history, room management, message reporting |
| `/api/calendar` | Global + personal events, todos |
| `/api/teacher` | Applications, verifications, profiles, ratings, classroom rooms |
| `/api/instructor` | Course upload/manage, views/downloads tracking, profiles, ratings |
| `/api/poster` | AI poster generation endpoint |

### User Roles & Subscriptions

```
Roles:   user → teacher → instructor → admin

Plans:
  Free     — 0 MAD      — Basic lessons, 10 offline downloads
  Pro      — 100/900 MAD  (monthly/yearly) — No ads, 100 downloads
  Premium  — 200/1900 MAD (monthly/yearly) — Unlimited, priority support
```

---

## 3. Admin Panel — `darsy-admin`

**Stack:** React 19, Vite, JavaScript (JSX)

### All 19 Pages

| Page | Route | Function |
|------|-------|---------|
| Login | `/login` | Admin authentication |
| Dashboard | `/` | Overview stats — users, content, activity |
| Users | `/users` | CRUD users, set roles, manage subscriptions, giveaway premium days |
| Lessons | `/lessons` | Manage full curriculum hierarchy |
| Teacher Applications | `/teacher-applications` | Review + approve/reject teacher applications |
| Teacher Verifications | `/teacher-verifications` | Review uploaded verification documents |
| Instructor Courses | `/instructor-courses` | Browse and manage all uploaded courses |
| News Manager | `/news` | Create / edit / delete news articles |
| Services | `/services` | School services CRUD |
| Chat Rooms | `/chat` | Monitor rooms, delete rooms |
| Contributions | `/contributions` | Approve / reject user-submitted resources |
| Feedback | `/feedback` | View and resolve bug reports and suggestions |
| Calendar | `/calendar` | Manage global school events |
| MongoDB Sync | `/mongo-sync` | Database sync tools |
| Batch Upload | `/batch-upload` | Bulk curriculum content upload |
| Firebase Upload | `/firebase-upload` | Firebase asset sync |
| YouTube Converter | `/youtube` | Convert YouTube links to lesson resources |
| **Content Creator** | `/content-creator` | AI-powered social media post + image generator |
| **Content Analytics** | `/content-analytics` | Content performance analytics |
| **Content Management** | `/content-management` | Content scheduling and management |
| **Poster Generation** | `/poster-generation` | AI poster generation with brand themes |
| **Launch Ideas** | `/launch-ideas` | Product launch ideation tool |

### Admin Utilities

| File | Purpose |
|------|---------|
| `utils/adminFetch.js` | Authenticated fetch wrapper for all admin API calls |
| `utils/aiService.js` | LLM request helper (OpenAI/Claude) for AI admin features |

### AI-Powered Admin Features

The admin panel includes several AI-powered tools:

- **Content Creator** (`ContentCreator.jsx`) — Generates social media content (text + AI images) with brand-consistent prompts. Supports white and green themes matching Darsy's `#3aaa6a` brand color. Generates platform-specific posts for Instagram, Facebook, Twitter.
- **Poster Generation** (`PosterGeneration.jsx`) — AI poster generator using structured image prompts with strict brand color enforcement.
- **Launch Ideas** (`LaunchIdeas.jsx`) — AI-assisted product/feature launch ideation.
- **Content Analytics** (`ContentAnalytics.jsx`) — Performance tracking for generated content.

---

## 4. Marketing Automation — `darsy-marketing/n8n`

**Stack:** N8N v2.14.2, Docker, ngrok (for webhooks), Telegram Bot (`darsyschoolbot`)

### 27 Pre-built Workflows (33 JSON files)

#### Marketing (12 workflows)
| Workflow | Purpose |
|----------|---------|
| `morocco-trends-poster` | Fetch Morocco trends → AI poster → Telegram approval flow |
| `morocco-trends-approval-handler` | Handle Telegram approve / reject / regenerate |
| `content-repurposing-engine` | Repurpose articles into all social formats automatically |
| `seo-keyword-monitor` | Track education keyword rankings daily |
| `competitor-spy` | Monitor competitor content and features |
| `ai-content-calendar` | AI-generate weekly content plan |
| `social-media-autopilot` | Auto-post from Google Sheets calendar |
| `social-listening-engagement` | Monitor mentions, sentiment, auto-reply |
| `ugc-collector` | Find and repost user-generated content |
| `viral-hook-generator` | Daily AI viral content ideas + visuals |
| `influencer-outreach` | Find and contact education influencers |
| `ai-social-media-manager` | Full AI agent managing all social media |

#### Engagement (6 workflows)
| Workflow | Purpose |
|----------|---------|
| `welcome-drip-sequence` | 5-email onboarding with smart branching |
| `reengagement-campaign` | Win back inactive users at 7/14/30/60 day milestones |
| `smart-newsletter` | AI-curated weekly newsletter (AR + FR) |
| `subscription-upgrade-nudge` | Personalized upsell for free users |
| `milestone-celebrations` | Celebrate streaks, completions, badges |
| `ai-support-chatbot` | Telegram bot with AI customer support |

#### Analytics (3 workflows)
| Workflow | Purpose |
|----------|---------|
| `weekly-growth-dashboard` | Full weekly report with AI insights |
| `churn-predictor` | AI identifies at-risk users daily |
| `ab-test-content` | Generate and track A/B content tests |

#### Growth (3 workflows)
| Workflow | Purpose |
|----------|---------|
| `referral-program` | Automated referral tracking + rewards |
| `viral-loop-engine` | Share achievements with pre-filled share links |
| `lead-magnet-funnel` | Lead capture → nurture → convert pipeline |

#### Advanced / Integrations (3 workflows)
| Workflow | Purpose |
|----------|---------|
| `personalized-recommendations` | AI lesson recommendations per user |
| `review-reputation-manager` | Monitor + respond to all reviews and mentions |
| `seasonal-campaign-engine` | Auto-launch seasonal campaigns (back-to-school, etc.) |
| `whatsapp-community-bot` | AI-powered WhatsApp support and engagement |

---

## Platform Features Summary

### Core Learning
- **Curriculum hierarchy:** School → Level → Guidance → Subject → Lesson
- **Lesson content:** PDFs, videos, exercises, exams, supplementary resources
- **Progress tracking:** Per-lesson completion %, time spent, resource views, streaks, favorites
- **Offline downloads:** Limited by subscription tier (10 / 100 / unlimited)

### Community & Interaction
- **Real-time chat:** Socket.io rooms organized by guidance + level, emoji reactions, message threading, user reporting
- **Teacher system:** Application with demo video, document verification, public profiles, classroom rooms with invite codes, 5-star ratings
- **Instructor system:** Course video + PDF upload, analytics (views/downloads), public profiles, ratings
- **Contributions hub:** User-submitted resources, admin approval queue, daily/weekly limits (higher for premium), public leaderboard

### Content & News
- **News system:** Articles with 1–5 star ratings, threaded Q&A, categories, tags, view tracking, save to favorites
- **School services:** Vacation schedules, registration periods, orientation info
- **Calendar:** Admin-managed global school events + personal events and todos per user

### User Management
- **Auth:** Email/password + Google OAuth, JWT access + refresh tokens
- **Roles:** user → teacher → instructor → admin (graduated permission system)
- **Subscriptions:** Free / Pro / Premium with monthly and yearly billing in MAD
- **Referral system:** Affiliate codes, referral count tracking, reward milestones
- **Giveaway system:** Admin can grant premium access days to any user

### Communication
- **Newsletter:** Email subscription list with admin broadcast capability
- **Contact form:** Sends email to admin + auto-reply to user
- **Feedback/Reports:** Bug, suggestion, and feedback types with status tracking (pending → reviewed → resolved)
- **Grades calculator:** Built-in Moroccan grade calculation tool

### Internationalization
- **Full AR / FR / EN support** via next-intl
- **RTL layout** for Arabic
- **Moroccan context:** MAD currency, Moroccan school calendar, Moroccan cities and education system

---

## Technology Stack (Complete)

| Layer | Technology |
|-------|-----------|
| Web frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, SCSS, next-intl |
| Admin panel | React 19, Vite, JavaScript |
| Backend API | Node.js, Express, TypeScript |
| Real-time | Socket.io |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (access + refresh) + Google OAuth 2.0 |
| Security | Helmet, CORS, rate limiting, bcryptjs, input sanitization |
| Email | Nodemailer (SMTP) |
| File storage | Local `/data` directory + Firebase (optional) |
| AI features | OpenAI API (image generation + text) via LLM service |
| Automation | N8N v2.14.2 (Docker) + ngrok for webhooks |
| Social channels | Telegram, Facebook, Instagram, WhatsApp |
| Data sources | Google Sheets, Google Drive, SerpAPI, MongoDB |

---

## Development Status

| Commit | Description |
|--------|-------------|
| `cdc7840` | First commit — initial project setup |
| `c5d2bde` | Download script, MongoDB mobile connection, progress tracking, news scraping |
| `6ed6257` | darsy-backend source files included in monorepo |
| `f72589b` | Responsiveness improvements, admin panel edits, code optimization, teacher + instructor systems |
| `a85b7e1` | Added Kinderly API keys |

---

## Local Development

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:5000/api` |
| N8N automation | `http://localhost:5678` |
| Webhook tunneling | ngrok → `https://<id>.ngrok-free.app` |

### N8N Session Setup
```bash
# 1. Start ngrok
ngrok http 5678

# 2. Restart n8n with new tunnel URL
docker rm -f n8n && docker run -d --name n8n -p 5678:5678 \
  -e WEBHOOK_URL=https://NEW_NGROK_URL/ \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

### Required N8N Credentials
| Credential | N8N Type |
|-----------|----------|
| OpenAI | OpenAI API |
| Telegram bot | Telegram API |
| Google Drive | Google Drive OAuth2 |
| Google Sheets | Google Sheets OAuth2 |
| MongoDB | MongoDB |
| Email | SMTP (SendGrid) |
| Facebook / Instagram | Environment variables |
| SerpAPI | Environment variable |
