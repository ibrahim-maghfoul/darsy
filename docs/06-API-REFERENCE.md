# Udarsy API Reference

Base URL: `http://localhost:5000/api`
Auth header: `Authorization: Bearer <access-token>` (also supported via signed cookie).
All JSON. Rate limits: `/api/auth` 20/15min, others 500/15min.

Auth legend: 🟢 public · 🔵 user (any logged in) · 🟡 admin · 🔴 API key (`x-api-key`)

---

## `/api/auth`

| Method | Path          | Auth | Body / Params                               | Response |
|--------|---------------|------|---------------------------------------------|----------|
| POST   | `/register`   | 🟢   | `{ email, password, displayName, affiliateCode? }` | `{ user, token }` + refresh cookie |
| POST   | `/login`      | 🟢   | `{ email, password }`                        | `{ user, token }` + refresh cookie |
| POST   | `/google`     | 🟢   | `{ idToken }` or `{ accessToken }`           | `{ user, token }` |
| POST   | `/logout`     | 🔵   | —                                            | `{ ok: true }` |
| POST   | `/refresh`    | 🟢 (cookie) | —                                     | `{ token }` |

## `/api/user`

| Method | Path                                  | Auth | Purpose |
|--------|---------------------------------------|------|---------|
| GET    | `/profile`                            | 🔵   | current user |
| PUT    | `/profile`                            | 🔵   | update displayName/school/level/settings |
| PUT    | `/profile/photo`                      | 🔵   | Multer `photo` — upload avatar |
| PUT    | `/password`                           | 🔵   | `{ currentPassword, newPassword }` |
| DELETE | `/account`                            | 🔵   | self-delete |
| POST   | `/report`                             | 🔵   | `{ type, title, description }` |
| GET    | `/saved-news`                         | 🔵   | list of saved news |
| POST   | `/saved-news/:id`                     | 🔵   | toggle save |
| POST   | `/subscribe`                          | 🔵   | `{ plan, cycle }` |
| GET    | `/affiliate-code`                     | 🔵   | get/create |
| GET    | `/contribution-status`                | 🔵   | usage vs limits |
| POST   | `/contribution-count/increment`       | 🔵   | bump counters |
| GET    | `/admin/users`                        | 🟡   | paginated list |
| PUT    | `/admin/users/:id/role`               | 🟡   | `{ role }` |
| PUT    | `/admin/users/:id/subscription`       | 🟡   | `{ plan, cycle, expiresAt }` |
| DELETE | `/admin/users/:id`                    | 🟡   | delete |
| GET    | `/admin/feedback`                     | 🟡   | all feedback |
| PUT    | `/admin/feedback/:id/status`          | 🟡   | `{ status }` |
| DELETE | `/admin/feedback/:id`                 | 🟡   | delete |
| POST   | `/admin/giveaway`                     | 🟡   | `{ userIds, days }` |

## `/api/progress`

| Method | Path                        | Auth | Body |
|--------|-----------------------------|------|------|
| POST   | `/track-view`               | 🔵   | `{ lessonId, resourceType, resourceId }` |
| POST   | `/update-progress`          | 🔵   | `{ lessonId, resourceId, timeSpent }` |
| POST   | `/mark-complete`            | 🔵   | `{ lessonId, resourceId, completed }` |
| POST   | `/toggle-favorite`          | 🔵   | `{ lessonId }` |
| GET    | `/favorites`                | 🔵   | populated favorites |
| GET    | `/subject/:subjectId`       | 🔵   | per-subject % |
| GET    | `/lesson/:lessonId`         | 🔵   | per-resource state |

## `/api/data`

| Method | Path                               | Auth | Purpose |
|--------|------------------------------------|------|---------|
| GET    | `/schools`                         | 🟢   | all schools (cached 5m) |
| GET    | `/levels/:schoolId`                | 🟢   | levels |
| GET    | `/guidances/:levelId`              | 🟢   | guidances |
| GET    | `/subjects/:guidanceId`            | 🟢   | subjects |
| GET    | `/lessons/:subjectId`              | 🟢   | lessons |
| GET    | `/lesson/:lessonId`                | 🟢   | single lesson |
| GET    | `/stats`                           | 🟢   | platform stats |
| POST   | `/contribute`                      | 🔵   | submit contribution (with optional file) |
| GET    | `/contributions/summary`           | 🟢   | leaderboard |
| GET    | `/contributions/recent`            | 🟢   | last 20 approved |
| GET    | `/contributions`                   | 🟡   | all paginated |
| PUT    | `/contributions/:id/status`        | 🟡   | `{ status, reviewNotes? }` |
| DELETE | `/contributions/:id`               | 🟡   | delete |
| POST/PUT/DELETE | `/schools /levels /guidances /subjects /lessons` | 🟡 | CRUD variants |
| GET    | `/school-services`                 | 🟢   | list |
| POST   | `/school-services`                 | 🟡   | create |
| PUT    | `/school-services/:id`             | 🟡   | update |
| DELETE | `/school-services/:id`             | 🟡   | delete |

## `/api/news`

| Method | Path                              | Auth | Body |
|--------|-----------------------------------|------|------|
| GET    | `/`                               | 🟢   | `?page&limit&category&search` |
| GET    | `/latest-id`                      | 🔴   | for scraper dedupe |
| GET    | `/:id`                            | 🟢   | article + userRating |
| POST   | `/`                               | 🟡   | create |
| PUT    | `/:id`                            | 🟡   | update |
| DELETE | `/:id`                            | 🟡   | delete |
| DELETE | `/`                               | 🟡   | delete all |
| POST   | `/bulk-upsert`                    | 🔴   | scraper idempotent ingest |
| GET    | `/:id/questions`                  | 🟢   | Q&A list |
| POST   | `/:id/questions`                  | 🔵   | `{ question }` |
| PUT    | `/:id/questions/:qid/answer`      | 🟡   | `{ answer }` |
| POST   | `/:id/view`                       | 🟢   | increment viewCount |
| POST   | `/:id/rate`                       | 🔵   | `{ stars: 1-5 }` |

## `/api/newsletter`

| Method | Path          | Auth | Body |
|--------|---------------|------|------|
| POST   | `/subscribe`  | 🟢   | `{ email }` |
| GET    | `/subscribers`| 🟡   | count + list |

## `/api/contact`

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST   | `/`  | 🟢   | `{ name, email, subject, message }` → email |

## `/api/chat`

| Method | Path                     | Auth | Purpose |
|--------|--------------------------|------|---------|
| GET    | `/history`               | 🔵   | `?roomId&before&limit` |
| GET    | `/rooms`                 | 🟡   | all rooms |
| DELETE | `/rooms/:id`             | 🟡   | delete |
| POST   | `/report`                | 🔵   | report user/message |

### Socket.io events (`/` namespace)
Auth: handshake must include JWT (`auth.token` or `Authorization` header).

| Event            | Direction  | Payload |
|------------------|------------|---------|
| `join_room`      | client→srv | `{ roomId }` |
| `send_message`   | client→srv | `{ roomId, content, replyTo? }` |
| `reaction`       | client→srv | `{ messageId, emoji }` |
| `typing_start`   | client→srv | `{ roomId }` |
| `typing_end`     | client→srv | `{ roomId }` |
| `message`        | srv→client | new Message doc |
| `reaction`       | srv→client | updated reactions |
| `typing`         | srv→client | `{ userId, state }` |

## `/api/calendar`

| Method | Path                   | Auth | Purpose |
|--------|------------------------|------|---------|
| GET    | `/global`              | 🟢   | global events (auto-seeds 31 on first call) |
| GET    | `/`                    | 🔵   | personal calendar |
| POST   | `/`                    | 🔵   | sync `{ events, todos }` |
| POST   | `/events`              | 🔵   | add event |
| PUT    | `/events/:id`          | 🔵   | update |
| DELETE | `/events/:id`          | 🔵   | delete |
| POST   | `/todos`               | 🔵   | add todo |
| PUT    | `/todos/:id`           | 🔵   | toggle/update |
| DELETE | `/todos/:id`           | 🔵   | delete |

## `/api/teacher`

| Method | Path                                  | Auth | Purpose |
|--------|---------------------------------------|------|---------|
| POST   | `/apply`                              | 🔵   | Multer `demoVideo` |
| GET    | `/applications/me`                    | 🔵   | mine |
| GET    | `/applications`                       | 🟡   | all |
| PUT    | `/applications/:id/review`            | 🟡   | `{ status, reviewNotes }` |
| POST   | `/verify`                             | 🔵   | Multer `documents[]` |
| GET    | `/verifications/me`                   | 🔵   | mine |
| GET    | `/verifications`                      | 🟡   | all |
| PUT    | `/verifications/:id/review`           | 🟡   | review |
| GET    | `/profiles`                           | 🟢   | browse |
| GET    | `/profiles/:id`                       | 🟢   | detail |
| POST   | `/profiles/me`                        | 🔵   | upsert |
| POST   | `/profiles/:id/rate`                  | 🔵   | `{ stars, comment? }` |
| POST   | `/rooms`                              | 🔵   | create room |
| GET    | `/rooms/me`                           | 🔵   | owned |
| GET    | `/rooms/joined`                       | 🔵   | joined |
| POST   | `/rooms/join/:inviteCode`             | 🔵   | join |
| GET    | `/rooms/:id`                          | 🔵   | detail |
| DELETE | `/rooms/:id`                          | 🔵 owner | delete |

## `/api/instructor`

| Method | Path                                  | Auth | Purpose |
|--------|---------------------------------------|------|---------|
| POST   | `/courses/upload`                     | 🔵 instructor | Multer `video`+`pdf` |
| GET    | `/courses/me`                         | 🔵   | own courses |
| GET    | `/courses/:instructorId`              | 🟢   | public list |
| GET    | `/courses/detail/:id`                 | 🟢   | course detail |
| POST   | `/courses/:id/view`                   | 🟢   | increment views |
| POST   | `/courses/:id/download`               | 🟢   | increment downloads |
| DELETE | `/courses/:id`                        | 🔵 owner/admin | delete |
| GET    | `/`                                   | 🟢   | list instructors (aggregation) |
| GET    | `/:instructorId`                      | 🟢   | profile |
| GET    | `/:instructorId/ratings`              | 🟢   | list |
| POST   | `/:instructorId/rate`                 | 🔵   | `{ stars, comment? }` |
| PUT    | `/profile/photo`                      | 🔵   | Multer `photo` |
| PUT    | `/profile/cover`                      | 🔵   | Multer `cover` |
| GET    | `/admin/courses`                      | 🟡   | all courses |

## `/api/poster` (admin content tooling)

| Method | Path                               | Auth | Purpose |
|--------|------------------------------------|------|---------|
| GET    | `/trends`                          | 🟡   | Google News RSS Morocco |
| GET    | `/proxy?url=...`                   | 🟡   | CORS image proxy |
| POST   | `/generate-poster-image`           | 🟡   | `{ prompt, provider, model?, size?, n? }` — Ghost (70 rotating keys) or DALL-E |
| POST   | `/save-session`                    | 🟡   | persist draft |
| GET    | `/sessions`                        | 🟡   | list drafts |
| DELETE | `/sessions/:topicId`               | 🟡   | delete |
| PATCH  | `/sessions/:topicId`               | 🟡   | update |
| POST   | `/save-poster-image`               | 🟡   | write image to `data/posters` |

---

## Health

- `GET /health` → `{ status: 'ok', timestamp }` (no auth, not under `/api`).

---

## Errors

Standard error envelope:
```
{ error: "Human readable message" }
```
With HTTP status set by handler (400/401/403/404/409/429/500).
