# Darsy Project - Claude Knowledge Base

This file is automatically read by Claude Code at the start of every conversation.
It contains everything Claude needs to know about this project without re-exploring it.

---

## What is Darsy?

Darsy is a **full-stack educational platform** targeting Moroccan students (secondary school, BAC prep, Brevet).
- **Market:** Morocco
- **Languages:** Arabic (Darija + MSA), French, English — full i18n support
- **Monetization:** Freemium — Free / Pro (100 MAD/mo or 900 MAD/yr) / Premium (200 MAD/mo or 1900 MAD/yr)
- **Currency:** MAD (Moroccan Dirham)

---

## Repository Structure

```
Darsy/
├── darsy-web/          # Next.js 16 frontend (main website)
├── darsy-backend/      # Node.js + Express API (TypeScript)
├── darsy-admin/        # React 19 + Vite admin panel
├── darsy-marketing/    # Marketing assets
│   └── n8n/            # N8N automation workflows (see below)
└── darsy-inspirations/ # Design references
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens) + Google OAuth |
| Email | Nodemailer |
| File storage | Local `/data` directory + Firebase (optional) |
| Security | Helmet, CORS, rate limiting, bcryptjs, input sanitization |
| Admin | React 19 + Vite |
| i18n | next-intl — locales: `ar`, `fr`, `en` |

---

## Backend

- **Entry:** `darsy-backend/src/server.ts`
- **Config:** `darsy-backend/src/config/index.ts` (env vars), `database.ts` (MongoDB connection)
- **Local dev port:** `5000`
- **API base:** `http://localhost:5000/api`

### User Roles
`user` → `teacher` → `instructor` → `admin`

### Subscription Plans
| Plan | Monthly | Yearly | Features |
|------|---------|--------|---------|
| Free | 0 | 0 | Basic lessons, 10 offline downloads |
| Pro | 100 MAD | 900 MAD | Premium lessons, no ads, 100 downloads |
| Premium | 200 MAD | 1900 MAD | Full access, unlimited downloads, priority support |

---

## All API Endpoints

### Auth — `/api/auth`
- `POST /register` — email/password signup
- `POST /login` — login
- `POST /google` — Google OAuth
- `POST /logout` — logout
- `POST /refresh` — refresh JWT token

### Users — `/api/user`
- `GET/PUT /profile` — get/update profile
- `POST /subscribe` — change subscription plan
- `POST /report` — submit bug/feedback
- `GET /contribution-status` — contribution limits
- `POST /contribution-count/increment` — track contribution
- `GET /admin/feedback` — list all feedback (admin)
- `PUT /admin/feedback/:id/status` — update feedback status (admin)
- `DELETE /admin/feedback/:id` — delete feedback (admin)

### Progress — `/api/progress`
- `POST /track-view` — log resource view
- `POST /update-progress` — update learning time
- `POST /mark-complete` — mark resource as completed
- `POST /toggle-favorite` — add/remove favorite lesson
- `GET /favorites` — get favorite lessons
- `GET /subject/:subjectId` — subject progress
- `GET /lesson/:lessonId` — lesson progress detail

### Curriculum Data — `/api/data`
- `GET /schools` — list schools
- `GET /levels/:schoolId` — levels in a school
- `GET /guidances/:levelId` — guidances (tracks) in a level
- `GET /subjects/:guidanceId` — subjects in a guidance
- `GET /lessons/:subjectId` — lessons in a subject
- `GET /lesson/:lessonId` — single lesson detail
- `GET /stats` — platform statistics
- `POST /contribute` — submit user contribution
- `GET /contributions/summary` — contributor stats
- `GET /contributions/recent` — recent contributions
- `GET /contributions` — all contributions (admin)
- `PUT /contributions/:id/status` — approve/reject (admin)
- `DELETE /contributions/:id` — delete (admin)
- `GET /school-services` — school services list
- `POST /school-services` — create service (admin)
- `PUT /school-services/:id` — update service (admin)
- `DELETE /school-services/:id` — delete service (admin)

### News — `/api/news`
- `GET /` — list news articles
- `POST /` — create article (admin)
- `PUT /:id` — update article (admin)
- `DELETE /:id` — delete article (admin)
- `GET /:id` — single article
- `POST /:id/rate` — rate article (1-5 stars)
- `GET /:id/questions` — get Q&A
- `POST /:id/questions` — ask question
- `PUT /:id/questions/:qid/answer` — answer question (admin)

### Newsletter — `/api/newsletter`
- `POST /subscribe` — subscribe to newsletter
- `GET /subscribers` — subscriber count (admin)

### Contact — `/api/contact`
- `POST /` — submit contact form → sends email

### Chat — `/api/chat`
- `GET /history` — chat history by guidance+level
- `GET /rooms` — all chat rooms (admin)
- `DELETE /rooms/:id` — delete room (admin)
- `POST /report` — report user/message

### Calendar — `/api/calendar`
- `GET /global` — global school events (public)
- `GET /` — user's personal calendar
- `POST /` — sync user calendar
- `POST /events` — add event
- `PUT /events/:id` — update event
- `DELETE /events/:id` — delete event
- `POST /todos` — add todo
- `PUT /todos/:id` — update todo
- `DELETE /todos/:id` — delete todo

### Teacher — `/api/teacher`
- `POST /apply` — submit teacher application (with demo video)
- `GET /applications/me` — my applications
- `GET /applications` — all applications (admin)
- `PUT /applications/:id/review` — approve/reject (admin)
- `POST /verify` — submit verification documents
- `GET /verifications` — all verifications (admin)
- `PUT /verifications/:id/review` — review verification (admin)
- `GET /profiles` — browse teachers
- `GET /profiles/:id` — teacher profile
- `POST /profiles/:id/rate` — rate a teacher
- `POST /rooms` — create classroom room
- `GET /rooms/me` — my rooms
- `GET /rooms/joined` — joined rooms
- `POST /rooms/join/:inviteCode` — join room by code

### Instructor — `/api/instructor`
- `POST /courses/upload` — upload course (video + PDF)
- `GET /courses/me` — my courses
- `GET /courses/:instructorId` — public courses
- `POST /courses/:id/view` — track view
- `POST /courses/:id/download` — track download
- `DELETE /courses/:id` — delete course
- `GET /` — list all instructors
- `GET /:instructorId` — instructor profile
- `GET /:instructorId/ratings` — ratings
- `POST /:instructorId/rate` — rate instructor
- `PUT /profile/photo` — update profile photo
- `PUT /profile/cover` — update cover photo
- `GET /admin/courses` — all courses (admin)

---

## MongoDB Models

| Collection | Key Fields |
|-----------|-----------|
| `users` | displayName, email, role, subscriptionPlan, billingCycle, subscriptionExpiry, affiliateCode, referralCount, lastLogin, settings (notifications, theme) |
| `schools` | title |
| `levels` | title, schoolId |
| `guidances` | title, levelId |
| `subjects` | title, guidanceId, imageUrl |
| `lessons` | title, subjectId, coursesPdf[], videos[], exercices[], exams[], resourses[] |
| `news` | title, description, content, image, category, tags, viewCount, ratings[], qaList[] |
| `contributions` | title, url, file, subjectId, lessonId, userId, status (pending/approved/rejected) |
| `feedback` | type (bug/suggestion/feedback), title, description, userId, status |
| `teacherapplications` | fullName, email, age, specialization, demoVideoUrl, level, guidance, subject, status, reviewNotes |
| `teacherverifications` | documents[], userId, status |
| `teacherrooms` | name, description, guidance, subject, ownerId, inviteCode, members[], memberLimit |
| `instructorcourses` | title, description, videoUrl, pdfUrl, guidanceId, subjectId, instructorId, views, downloads |
| `chatmessages` | content, senderId, roomId, reactions[], replyTo |
| `chatrooms` | guidanceId, levelId, lastMessage, messageCount |
| `calendarevents` | title, description, date, endDate, category, color, userId (null = global) |
| `newslettersubscribers` | email, subscribedAt |
| `schoolservices` | title, description, icon, category, contentBlocks[], externalUrl, active, order |

---

## Frontend — darsy-web

- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS + SCSS modules
- **i18n:** next-intl — messages in `darsy-web/messages/ar.json`, `en.json`, `fr.json`
- **API client:** `darsy-web/src/lib/api.ts`
- **Auth context:** `darsy-web/src/contexts/AuthContext.tsx`
- **Services:** `darsy-web/src/services/data.ts`, `progress.ts`

### All Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, courses preview, chat demo, team, pricing |
| `/explore` | Curriculum browser — select school/level/guidance/subject |
| `/explore/subject/[subjectId]` | Subject page with lesson cards |
| `/lesson/[lessonId]` | Lesson player — PDFs, videos, exercises, exams, progress tracking |
| `/lesson/[lessonId]/preview` | Public lesson preview |
| `/news` | News grid with pagination |
| `/news/[id]` | Article detail with Q&A and ratings |
| `/contact` | Contact form |
| `/download` | Resource download hub |
| `/contributions` | Contribution hub — leaderboard, submit resources |
| `/profile` | User profile — stats, photo, settings, logged lessons |
| `/profile/chat` | Real-time chat interface |
| `/teacher` | Browse teachers directory |
| `/teacher/[id]` | Teacher profile with ratings |
| `/teacher/dashboard` | Teacher dashboard — rooms, invites, profile |
| `/instructor/[id]` | Instructor profile with courses and ratings |
| `/teacher/dashboard` becomes `/instructor-dashboard` | Instructor upload and manage courses |
| `/apply-instructor` | Multi-step instructor application |
| `/apply-teacher` | Teacher verification document submission |
| `/calendar` | Interactive calendar — events and todos |
| `/report` | Bug/feedback submission |
| `/not-found` | 404 page |
| `/design-test` | Internal design testing (not production) |

---

## Admin Panel — darsy-admin

- **Framework:** React 19 + Vite
- **Entry:** `darsy-admin/src/App.jsx`
- **Layout:** `darsy-admin/src/components/Layout.jsx`

### Admin Pages
| Page | Route | Function |
|------|-------|---------|
| Dashboard | `/` | Overview stats — users, content, activity |
| Users | `/users` | CRUD users, set roles, manage subscriptions |
| Lessons | `/lessons` | Manage curriculum hierarchy |
| Teacher Applications | `/teacher-applications` | Review + approve/reject applications |
| Teacher Verifications | `/teacher-verifications` | Review documents |
| Instructor Courses | `/instructor-courses` | Manage uploaded courses |
| News | `/news` | Create/edit/delete articles |
| Services | `/services` | School services management |
| Chat Rooms | `/chat` | Monitor and delete rooms |
| Contributions | `/contributions` | Approve/reject user contributions |
| Feedback | `/feedback` | View and resolve user reports |
| Calendar | `/calendar` | Manage global events |
| MongoDB Sync | `/mongo-sync` | Database sync tools |
| Batch Upload | `/batch-upload` | Bulk content upload |
| Firebase Upload | `/firebase-upload` | Firebase sync |
| YouTube Converter | `/youtube` | Convert YouTube links |

---

## N8N Marketing Automation

**Location:** `darsy-marketing/n8n/`
**N8N instance:** Local Docker, `http://localhost:5678`
**Full setup guide:** `darsy-marketing/n8n/docs/credentials-setup-guide.md`

### All Workflows Built (27 total)

#### Marketing (12)
| File | Purpose |
|------|---------|
| `morocco-trends-poster.json` | Fetch Morocco trends → AI poster → Telegram approval |
| `morocco-trends-approval-handler.json` | Handle Telegram approve/reject/regenerate |
| `content-repurposing-engine.json` | Repurpose articles into all social formats |
| `seo-keyword-monitor.json` | Track education keyword rankings daily |
| `competitor-spy.json` | Monitor competitor content/features |
| `ai-content-calendar.json` | AI-generate weekly content plan |
| `social-media-autopilot.json` | Auto-post from Google Sheets calendar |
| `social-listening-engagement.json` | Monitor mentions + sentiment + auto-reply |
| `ugc-collector.json` | Find and repost user-generated content |
| `viral-hook-generator.json` | Daily AI viral content ideas + visuals |
| `influencer-outreach.json` | Find and contact education influencers |
| `ai-social-media-manager.json` | Full AI agent managing social media |

#### Engagement (6)
| File | Purpose |
|------|---------|
| `welcome-drip-sequence.json` | 5-email onboarding with smart branching |
| `reengagement-campaign.json` | Win back users at 7/14/30/60 day inactivity |
| `smart-newsletter.json` | AI-curated weekly newsletter (AR+FR) |
| `subscription-upgrade-nudge.json` | Personalized upsell for free users |
| `milestone-celebrations.json` | Celebrate streaks, completions, badges |
| `ai-support-chatbot.json` | Telegram bot with AI customer support |

#### Analytics (3)
| File | Purpose |
|------|---------|
| `weekly-growth-dashboard.json` | Full weekly report with AI insights |
| `churn-predictor.json` | AI identifies at-risk users daily |
| `ab-test-content.json` | Generate and track A/B content tests |

#### Growth (3)
| File | Purpose |
|------|---------|
| `referral-program.json` | Automated referral tracking + rewards |
| `viral-loop-engine.json` | Share achievements with pre-filled links |
| `lead-magnet-funnel.json` | Lead capture → nurture → convert |

#### Advanced / Integrations (3)
| File | Purpose |
|------|---------|
| `personalized-recommendations.json` | AI lesson recommendations per user |
| `review-reputation-manager.json` | Monitor + respond to all reviews/mentions |
| `seasonal-campaign-engine.json` | Auto-launch seasonal campaigns |
| `whatsapp-community-bot.json` | AI-powered WhatsApp support |

### N8N Credentials Needed
| Credential | Type in n8n |
|-----------|------------|
| OpenAI | OpenAI API |
| Telegram | Telegram API |
| Google Drive | Google Drive OAuth2 |
| Google Sheets | Google Sheets OAuth2 |
| MongoDB | MongoDB |
| Email | SMTP (SendGrid) |
| Facebook/Instagram | Environment variables |
| SerpAPI | Environment variable |

### N8N Environment Variables
```
FB_PAGE_ID
FB_PAGE_ACCESS_TOKEN
IG_BUSINESS_ACCOUNT_ID
SERPAPI_KEY
WHATSAPP_PHONE_ID
WHATSAPP_TOKEN
N8N_WEBHOOK_URL=http://localhost:5678
CONTENT_SHEET_ID
```

---

## Key Platform Features Summary

1. **Curriculum hierarchy:** School → Level → Guidance → Subject → Lesson (PDFs, videos, exercises, exams)
2. **Progress tracking:** Per-lesson completion, time tracking, resource views, streaks, favorites
3. **News system:** Articles with ratings (1-5 stars), Q&A, categories, view tracking, save to favorites
4. **Real-time chat:** Socket.io rooms by guidance+level, emoji reactions, message threading, user reporting
5. **Teacher system:** Application (with demo video), verification (documents), public profiles, classroom rooms with invite codes, ratings
6. **Instructor system:** Course uploads (video + PDF), analytics (views, downloads), ratings, public profiles
7. **Contributions hub:** User-submitted resources, admin approval, daily/weekly limits (higher for premium), leaderboard
8. **Calendar:** Global school events (admin-managed) + personal events/todos per user
9. **Newsletter:** Email subscription list with admin broadcast
10. **Contact form:** Sends email to admin + auto-reply to user
11. **Feedback/Reports:** Bug, suggestion, feedback types — status tracking (pending/reviewed/resolved)
12. **School services:** Vacation schedules, registration periods, orientation info
13. **Referral system:** Affiliate codes, referral count tracking, reward milestones
14. **Giveaway system:** Admin can grant premium days to users
15. **Multilingual:** Full AR/FR/EN support with RTL for Arabic

---

## Development History

1. **First commit** — Initial project setup
2. **Second commit** (`c5d2bde`) — Download script, mobile MongoDB connection, progress tracking, news scraping
3. **Third commit** (`6ed6257`) — darsy-backend source files included in main repo
4. **Latest commit** (`f72589b`) — Responsiveness improvements, admin panel edits, code optimization, teacher and instructor systems added

---

## Important Notes for Claude

- **Never re-explore the full codebase** — all key info is in this file
- **Backend port is 5000** — not 3000
- **MongoDB Docker networking** — use `host.docker.internal` not `localhost` when n8n calls MongoDB
- **All n8n workflows** are pre-built in `darsy-marketing/n8n/workflows/`
- **N8N docs** are in `darsy-marketing/n8n/docs/` — full setup guides per workflow category
- **This file lives at** `C:\Users\ibo\Desktop\Darsy\CLAUDE.md` — root of the workspace, auto-loaded by Claude Code
- **User is building n8n workflows** as their main current focus — help debug via screenshots, build new workflows on request, reference the existing 27 workflows before building new ones
- **Platform language:** Mix of Arabic Darija, French, English in content — always consider bilingual output
- **Platform is Moroccan** (not Algerian) — currency MAD, Moroccan school calendar, Moroccan cities

---

## N8N Setup Status

- **N8N version:** 2.14.2 (built-in tunnel removed in this version)
- **N8N container:** Docker, named `n8n`, port 5678
- **Tunnel solution:** ngrok (required — N8N_TUNNEL=true no longer works in v2.14+)
- **Webhook URL env var:** Set via `-e WEBHOOK_URL=https://xxxx.ngrok-free.app/` in docker run command
- **Telegram Bot:** `darsyschoolbot` — token must be regenerated (was exposed in chat)
- **Command Center workflow:** ✅ Working — published and receiving Telegram messages
- **How to start ngrok each session:**
  ```bash
  ngrok http 5678
  ```
  Then restart n8n with new URL:
  ```bash
  docker rm -f n8n && docker run -d --name n8n -p 5678:5678 -e WEBHOOK_URL=https://NEW_URL/ -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
  ```
- **Workflow activation:** Use **Publish** button (top right) — not a toggle switch in this version
- **All 27 workflows** have webhook triggers added (patched via add-webhook-triggers.js)
- **Credentials still needed:** OpenAI API, Google Drive, Google Sheets, MongoDB, SendGrid
