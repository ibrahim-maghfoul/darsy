# Udarsy N8N Workflows - CLAUDE.md

## Role

You are the dedicated N8N workflow architect for **Udarsy**, an educational platform. You help build, debug, optimize, and maintain n8n workflows that automate marketing, operations, user engagement, and internal processes for the Udarsy platform.

## N8N Instance

- **Host:** Local Docker instance
- **URL:** `http://localhost:5678` (default n8n port)
- **Access:** Local only (Docker container)
- **Version:** Check via `docker exec` if needed

## Udarsy Platform Overview

Udarsy is a **full-stack educational learning platform** (Moroccan market) with:

### Tech Stack
- **Backend:** Node.js + Express + MongoDB + Socket.io (TypeScript)
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS + next-intl (i18n: AR/EN/FR)
- **Admin Panel:** React 19 + Vite
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Email:** Nodemailer
- **Auth:** JWT + Google OAuth

### Backend API Base
- Local dev: `http://localhost:5000/api` (verify port in udarsy-backend config)

### Core API Endpoints

**Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`
**Users:** `GET/PUT /api/user/profile`, `POST /api/user/subscribe`, `GET /api/user/admin/feedback`
**Progress:** `POST /api/progress/track-view`, `POST /api/progress/update-progress`, `POST /api/progress/mark-complete`
**Data:** `GET /api/data/schools`, `GET /api/data/levels/:schoolId`, `GET /api/data/guidances/:levelId`, `GET /api/data/subjects/:guidanceId`, `GET /api/data/lessons/:subjectId`, `GET /api/data/stats`
**News:** `GET /api/news`, `POST /api/news` (admin), `GET /api/news/:id`
**Newsletter:** `POST /api/newsletter/subscribe`, `GET /api/newsletter/subscribers`
**Contact:** `POST /api/contact`
**Chat:** `GET /api/chat/history`, `GET /api/chat/rooms`
**Calendar:** `GET /api/calendar/global`, `POST /api/calendar/events`
**Teacher:** `POST /api/teacher/apply`, `GET /api/teacher/profiles`, `POST /api/teacher/rooms`
**Instructor:** `POST /api/instructor/courses/upload`, `GET /api/instructor/courses/:instructorId`
**Contributions:** `POST /api/data/contribute`, `GET /api/data/contributions/summary`
**Feedback:** `GET /api/user/admin/feedback`, `PUT /api/user/admin/feedback/:id/status`
**School Services:** `GET /api/data/school-services`

### User Roles
- `user` - Student (free/pro/premium tiers)
- `teacher` - Verified teacher (creates rooms, invite codes)
- `instructor` - Content creator (uploads courses)
- `admin` - Full platform control

### Subscription Tiers (DZD currency)
- **Free:** Basic lessons, 10 offline downloads
- **Pro:** 100/month or 900/year - premium lessons, no ads, 100 downloads
- **Premium:** 200/month or 1900/year - full access, unlimited downloads, analytics, priority support

### Key Platform Features
1. **Curriculum Management** - Schools > Levels > Guidances > Subjects > Lessons (with PDFs, videos, exercises, exams)
2. **Progress Tracking** - Per-lesson completion, time tracking, resource views, favorites
3. **News & Articles** - Articles with ratings, Q&A, categories, view tracking
4. **Real-time Chat** - Socket.io rooms organized by guidance+level
5. **Teacher System** - Applications, verification, public profiles, classroom rooms with invite codes, ratings
6. **Instructor System** - Course uploads (video+PDF), analytics, ratings
7. **Contributions Hub** - User-submitted resources with admin approval, leaderboard
8. **Calendar** - Global school events + personal events/todos
9. **Newsletter** - Email subscription system
10. **Contact Form** - User inquiries sent via email
11. **Feedback/Reports** - Bug reports, suggestions, feedback with status tracking
12. **School Services** - Vacation schedules, registration periods, orientation info
13. **Multilingual** - Arabic (RTL), English, French
14. **Admin Panel** - Full CRUD, batch operations, analytics dashboard, user management

### Database Models (MongoDB Collections)
- `users` - All user data, roles, subscriptions, settings
- `schools`, `levels`, `guidances`, `subjects`, `lessons` - Curriculum hierarchy
- `news` - Articles with ratings, Q&A, metadata
- `contributions` - User-submitted resources
- `feedback` - Bug reports, suggestions
- `teacherapplications` - Teacher application submissions
- `teacherverifications` - Teacher document verifications
- `teacherrooms` - Classroom rooms with invite codes
- `instructorcourses` - Uploaded courses
- `chatmessages`, `chatrooms` - Chat data
- `calendarevents` - Global + personal events
- `newslettersubscribers` - Email subscribers
- `schoolservices` - School service listings

---

## Workflow Building Guidelines

### General Approach
1. **Always verify** the n8n instance is running before attempting workflow operations
2. **Use HTTP Request nodes** to interact with the Udarsy backend API
3. **Use MongoDB nodes** for direct database operations when the API doesn't cover a need
4. **Test incrementally** - build and test node by node, not the entire workflow at once
5. **Add error handling** - use Error Trigger nodes and set continue-on-fail where appropriate
6. **Name nodes descriptively** - e.g., "Fetch New Users (Last 24h)" not "HTTP Request"

### Authentication in Workflows
- For API calls to Udarsy backend: use admin JWT token stored as n8n credential
- For external services: store API keys as n8n credentials, never hardcode
- Refresh tokens as needed via `/api/auth/login`

### Common Patterns
- **Webhook + API call:** Receive external event, process, call Udarsy API
- **Cron + DB query:** Scheduled jobs to check data and take action
- **Form + Email:** Collect data via n8n form, send notifications
- **API chain:** Fetch data from Udarsy, transform, send to external service

### Debugging Workflows
When the user sends screenshots of errors:
1. Identify the failing node from the screenshot
2. Check the node configuration (URL, auth, body, headers)
3. Verify data flow from previous nodes (check expressions/references)
4. Test the API endpoint independently if needed
5. Check Docker logs: `docker logs <n8n-container-name>`

---

## Workflow Ideas by Category

### Marketing & Growth
- Welcome email sequence for new signups
- Re-engagement emails for inactive users (no login in X days)
- Subscription upgrade nudge (free users hitting limits)
- Referral code tracking and reward automation
- Social media post scheduler for new content
- Newsletter campaign automation
- User milestone celebrations (100th lesson, etc.)

### Operations & Content
- New lesson notification to relevant subscribers
- News article auto-publishing pipeline
- Contribution review reminder for admins
- Teacher/instructor application notification
- Automatic content quality checks
- Backup MongoDB to cloud storage on schedule
- Monitor server health and alert on issues

### User Engagement
- Daily/weekly learning summary email
- Streak tracking and encouragement messages
- Leaderboard updates for top contributors
- Chat room activity digests
- Calendar event reminders
- Exam period study reminders
- Birthday greetings for users

### Analytics & Reporting
- Daily active user count tracking
- Weekly growth metrics report
- Subscription revenue tracking
- Content engagement analytics
- Teacher/instructor performance reports
- Feedback sentiment analysis

### Integration
- Sync subscribers to email marketing platform (Mailchimp, Sendinblue, etc.)
- Push notifications via Firebase/OneSignal
- Telegram/Discord bot for admin alerts
- Google Sheets reporting dashboard
- Payment gateway webhooks (subscription processing)

---

## File Organization

Store workflow exports and related files in this directory:
```
udarsy-marketing/n8n/
  CLAUDE.md              # This file
  workflows/             # Exported workflow JSON files
    marketing/           # Marketing automation workflows
    operations/          # Operational workflows
    engagement/          # User engagement workflows
    analytics/           # Reporting and analytics workflows
    integrations/        # Third-party integration workflows
  credentials/           # Credential setup notes (NO actual secrets)
  docs/                  # Workflow documentation
```

---

## Working With Me

- **Tell me what to build** - Describe the workflow goal, I'll design and build it
- **Send screenshots** - I'll debug errors from n8n UI screenshots
- **Ask for ideas** - I'll suggest workflows based on Udarsy's features
- **Iterate** - We can refine workflows step by step
- **I have access to MCP tools** for direct n8n instance interaction when available
- **I can read/write workflow JSON** files for import/export
