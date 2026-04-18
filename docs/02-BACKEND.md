# Darsy Backend — Function Reference

Entry: [darsy-backend/src/server.ts](../darsy-backend/src/server.ts)
Base URL: `http://localhost:5000/api`

## Bootstrap (server.ts)

1. Creates Express app + HTTP server + Socket.io with CORS.
2. `io.use(...)` — verifies JWT on socket handshake (`auth.token` or `Authorization` header).
3. `io.on('connection', ...)` — delegates to `handleChatConnection(io, socket)`.
4. `connectDatabase()` — Mongoose connect with pooling.
5. Middleware order:
   - `helmet` (CSP with self/unsafe-inline for styles, https/data: for images)
   - `cors(config.cors)`
   - `express.json({ limit: 10mb })`, `express.urlencoded(...)`, `cookieParser`, `compression`
   - `sanitizeInputs` → strips `$`/`.` keys (NoSQL injection)
   - `sanitizeStrings` → strips HTML/XSS
   - `/api/auth` → `authRateLimiter` (20 req/15min), `/api/` → `generalRateLimiter` (500/15min)
   - `morgan('dev'|'combined')`
6. Static dirs (`maxAge: 7d`): `/data/{images,resources,videos,documents,verifications}`; posters `maxAge: 0`.
7. Mounts 12 routers under `/api/*`.
8. 404 fallback + `errorHandler`.
9. Unhandled rejection / exception logged but process kept alive.

---

## Config

### config/index.ts
Env-backed config object:
- `nodeEnv`, `port` (5000)
- `mongoUri`
- `jwt.accessSecret`, `jwt.refreshSecret`, `jwt.accessExpiresIn`, `jwt.refreshExpiresIn`
- `cors.origin`, `cors.credentials`
- `cookie.secret`, `cookie.maxAge`
- `email.host`, `email.port`, `email.user`, `email.pass`, `email.from`
- `google.clientId`, `google.clientSecret`

### config/database.ts
- `connectDatabase()` — `mongoose.connect(config.mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 })`. Logs success/failure.

---

## Middleware

### middleware/auth.ts
- `authMiddleware(req, res, next)` — requires `Authorization: Bearer <token>` or signed cookie `accessToken`. Verifies JWT, attaches `req.user = { id, email, role }`. 401 on missing/invalid.
- `optionalAuth(req, res, next)` — same as above but tolerates missing/invalid (req.user undefined).
- `adminMiddleware(req, res, next)` — requires `req.user.role === 'admin'`. Use after `authMiddleware`.

### middleware/security.ts
- `sanitizeInputs(req, res, next)` — recursively walks `body`, `query`, `params`; deletes keys that contain `$` or `.`.
- `sanitizeStrings(req, res, next)` — recursively strips tags `< >` from string values in body/query.
- `validateApiKey(req, res, next)` — checks `x-api-key` header against env `API_KEY`. Used for scraper/internal routes.
- `authRateLimiter` — express-rate-limit, 20 requests/15 min per IP.
- `generalRateLimiter` — 500 requests/15 min per IP.

### middleware/upload.ts (Multer)
All configs use `diskStorage` into a subfolder of `data/`. `verifyMagicBytes(filePath, expected)` reads the first bytes and matches JPEG (`FFD8FF`), PNG (`89504E47`), GIF (`47494638`), PDF (`25504446`). Files failing the check are deleted.

| Config               | Dir                         | Max size  | Allowed MIMEs                         |
|----------------------|-----------------------------|-----------|---------------------------------------|
| `upload`             | `data/images`               | 5 MB      | image/jpeg, image/png, image/gif      |
| `resourceUpload`     | `data/resources`            | 10 MB     | application/pdf                       |
| `videoUpload`        | `data/videos`               | 500 MB    | video/mp4, video/webm                 |
| `courseUpload`       | `data/documents`            | 500 MB    | video/* + application/pdf             |
| `coverUpload`        | `data/images`               | 5 MB      | image/jpeg, image/png                 |
| `verificationUpload` | `data/verifications`        | 10 MB     | image/*, application/pdf              |

### middleware/errorHandler.ts
- `errorHandler(err, req, res, next)` — logs, returns `{ error: err.message || 'Server error' }` with `err.status || 500`.

---

## Utilities

### utils/auth.ts
- `hashPassword(plain)` → `bcrypt.hash(plain, 12)`.
- `comparePassword(plain, hashed)` → `bcrypt.compare(...)`.
- `hashRefreshToken(token)` → SHA-256 hex digest (stored in DB; raw is set as signed cookie).
- `generateAffiliateCode(userId)` → 8-char uppercase alphanumeric, retries on collision.
- `generateAccessToken({id, email, role})` → `jwt.sign(payload, accessSecret, { expiresIn: '15m' })`.
- `generateRefreshToken({id})` → `jwt.sign(payload, refreshSecret, { expiresIn: '30d' })`.
- `verifyAccessToken(token)` / `verifyRefreshToken(token)` → returns decoded or throws.

### utils/email.ts
- `sendEmail({ to, subject, html, text? })` — nodemailer transporter from `config.email`, returns `info`. Silent-fail logs without throwing.

### utils/cache.ts (new)
- `class TTLCache<V>`:
  - `get(key)` — returns value if not expired, else `null`.
  - `set(key, value, ttlMs?)` — default TTL 5 min.
  - `del(key)`, `clear()`.
  - `invalidatePrefix(prefix)` — deletes all keys starting with prefix (useful after curriculum writes).
- Used by `dataController` to cache schools/levels/guidances/subjects/lessons.

---

## Sockets

### sockets/chat.ts
`handleChatConnection(io, socket)` event handlers:
- `join_room({ roomId })` — joins socket.io room, loads last 50 messages.
- `send_message({ roomId, content, replyTo? })` — saves `Message`, emits `message` to room.
- `reaction({ messageId, emoji })` — toggles emoji reaction on message.
- `typing_start({ roomId })` / `typing_end({ roomId })` — broadcasts to room.
- `disconnect` — logs, cleans up.

Auth is enforced at `io.use` handshake (JWT required).

---

## Controllers

### authController.ts

- `register(req, res)` — body `{ email, password, displayName, affiliateCode? }`. Validates, hashes password, creates `User`, generates affiliate code, applies referral bonus (+3 premium days + referralCount for referrer), issues JWT + refresh cookie.
- `login(req, res)` — `{ email, password }`. Finds user, `comparePassword`, updates `lastLogin`, returns access token + sets refresh cookie (httpOnly, signed).
- `googleLogin(req, res)` — accepts either `idToken` (server-verifies with Google) or `accessToken` (fetches userinfo). Creates user if new (with random password hash), issues JWT.
- `logout(req, res)` — clears refresh cookie + invalidates refresh token hash in DB.
- `refreshToken(req, res)` — reads signed cookie, hashes, compares with DB record, issues new access + rotates refresh.

### userController.ts

Admin:
- `getAllUsers(req, res)` — paginated list, optional search/role/plan filters.
- `setUserRole(req, res)` — `PUT /admin/users/:id/role { role }`.
- `setUserSubscription(req, res)` — set plan, cycle, expiry.
- `deleteUserAdmin(req, res)` — hard delete + cascade.
- `getAllFeedback`, `updateFeedbackStatus`, `deleteFeedback` — feedback mgmt.
- `runGiveaway(req, res)` — grants N premium days to list of userIds.

User:
- `getProfile(req, res)` — returns full `User` doc minus secrets.
- `updateProfile(req, res)` — patch displayName/school/level/settings.
- `changePassword(req, res)` — verifies current, hashes new.
- `uploadProfilePicture(req, res)` — Multer `upload.single('photo')`; verifies magic bytes; saves URL on user.
- `deleteAccount(req, res)` — soft-delete / user-initiated.
- `createReport(req, res)` — creates `Feedback` doc (bug/suggestion/feedback).
- `getSavedNews`, `toggleSavedNews` — per-user news favorites.
- `subscribe(req, res)` — `{ plan, cycle }`; sets plan, computes expiry (+30d or +365d).
- `getAffiliateCode(req, res)` — returns code (creates if missing).
- `getContributionStatus(req, res)` — daily/weekly usage vs limits (free: 3/d, 10/w; pro: 6/d, 20/w; premium: 12/d, 40/w).
- `incrementContributionCount(req, res)` — bumps counts; resets window if past TTL.

### dataController.ts

Read (all cached 5 min via TTLCache):
- `getSchools(req, res)` — returns all schools.
- `getLevels(req, res)` — `:schoolId`.
- `getGuidances(req, res)` — `:levelId`.
- `getSubjects(req, res)` — `:guidanceId`.
- `getLessons(req, res)` — `:subjectId` (includes resource counts).
- `getLessonById(req, res)` — `:lessonId` with full resource lists.
- `getGlobalStats(req, res)` — counts across collections for public homepage.

Write (admin, invalidates cache):
- `create/update/deleteSchool`, `create/update/deleteLevel`, `create/update/deleteGuidance`, `create/update/deleteSubject`, `create/update/deleteLesson`.
- `upsertGuidanceStats(guidanceId)` — recomputes subject/lesson counts.

Contributions:
- `contribute(req, res)` — auth'd user submits `{ title, url?, file?, subjectId, lessonId }`. Increments counters, creates `Contribution(status='pending')`.
- `getContributionsSummary(req, res)` — top contributors leaderboard.
- `getRecentContributions(req, res)` — last 20 approved.
- `getAllContributions(req, res)` — admin paginated.
- `updateContributionStatus(req, res)` — admin approve/reject; on approve, attaches file to lesson resources.
- `deleteContribution(req, res)` — admin delete.

School services (admin CRUD + public read):
- `getSchoolServices`, `createService`, `updateService`, `deleteService`.

### progressController.ts

- `trackResourceView(req, res)` — `{ lessonId, resourceType, resourceId }`. Upserts into `user.progress.lessons[]`, marks resource viewed, awards +2 points (capped per day via `maybeGrantPointsPremium`).
- `updateResourceProgress(req, res)` — `{ lessonId, resourceId, timeSpent }`. Debounced client-side; accumulates seconds.
- `markResourceComplete(req, res)` — `{ lessonId, resourceId, completed }`. +10 pts on true, -10 pts on unmark.
- `toggleLessonFavorite(req, res)` — toggles lessonId in `user.favoriteLessons`.
- `getFavoriteLessons(req, res)` — list populated with subject/lesson details.
- `getSubjectProgress(req, res)` — per-subject completion percentage.
- `getLessonProgressById(req, res)` — per-resource state for a lesson.
- `updateLessonResourceCount(lessonId)` — internal helper used by data writes.
- `maybeGrantPointsPremium(user)` — internal: if free user crosses 1000 points in current month, grants 14 premium days, resets monthly bucket.

### newsController.ts

- `getAllNews(req, res)` — query `{ page, limit, category?, search? }`. Paginated, sorts by `createdAt desc`.
- `getLatestId(req, res)` — returns highest numeric `_id` (used by scraper to dedupe).
- `getNewsById(req, res)` — adds user-specific `userRating` if auth.
- `createNews`, `updateNews`, `deleteNews`, `deleteAllNews` — admin.
- `bulkUpsert(req, res)` — protected by `validateApiKey`; idempotent insert-or-update for scraper.
- Q&A: `getQuestions(:id)`, `askQuestion(:id)` (auth), `answerQuestion(:id/:qid)` (admin).
- `trackView(req, res)` — increments `viewCount`.
- `rateNews(req, res)` — 1-5 stars, updates `rating.average/count/total` and upserts `userRatings[]`.

### teacherController.ts

Applications:
- `submitApplication(req, res)` — Multer `videoUpload.single('demoVideo')`. Saves video URL, creates `TeacherApplication(status='pending')`.
- `getMyApplications(req, res)` — user's own.
- `listApplications(req, res)` — admin, paginated.
- `reviewApplication(req, res)` — admin approve/reject with `reviewNotes`; on approve, promotes user role to `teacher`.

Verifications:
- `submitVerification(req, res)` — `verificationUpload.array('documents', 5)`; creates `TeacherVerification`.
- `getMyVerification`, `listVerifications` (admin), `reviewVerification` (admin).

Profiles:
- `createOrUpdateProfile(req, res)` — upsert teacher profile (bio, subjects, rates, availability).
- `getProfile(:id)`, `getMyProfile`, `listProfiles` (paginated browse).
- `rateTeacher(req, res)` — 1-5 stars + comment.

Rooms:
- `createRoom(req, res)` — generates 8-char invite code; creates `TeacherRoom` with `memberLimit`.
- `joinRoom(req, res)` — `:inviteCode`; checks member limit; adds user.
- `getMyRooms` (owned), `getJoinedRooms` (as member), `getRoom(:id)`, `deleteRoom(:id)` (owner only).

### instructorController.ts

Courses:
- `uploadCourse(req, res)` — `courseUpload.fields([{video},{pdf}])`. Magic-byte verification, saves paths, creates `InstructorCourse`.
- `getInstructorCourses(:instructorId)` — public list.
- `getMyCourses(req, res)` — owner.
- `getCourse(:id)` — detail.
- `deleteCourse(req, res)` — owner or admin.
- `trackView(:id)` — increments `views`.
- `trackDownload(:id)` — increments `downloads`.

Profile:
- `updateProfilePhoto(req, res)` — `upload.single('photo')`.
- `updateCoverPhoto(req, res)` — `coverUpload.single('cover')`.
- `listInstructors(req, res)` — single aggregation pipeline combining courses + ratings; no N+1.
- `getInstructorProfile(:instructorId)` — detail with aggregates.

Ratings:
- `submitRating(:instructorId)` — `{ rating, comment }`; upserts on (userId, instructorId).
- `getRatings(:instructorId)` — list + average.

Admin:
- `getAllCoursesAdmin(req, res)` — full course list.

### calendarController.ts

- `getCalendar(req, res)` — user's personal events + todos.
- `syncCalendar(req, res)` — bulk upsert from client state.
- `addEvent`, `updateEvent`, `deleteEvent` — per-event CRUD.
- `addTodo`, `toggleTodo`, `deleteTodo` — per-todo CRUD.
- `getGlobalEvents(req, res)` — `userId: null` events. On first call, seeds 31 UN/Morocco observances if none exist.

### contactController.ts

- `submitContact(req, res)` — `{ name, email, subject, message }`. Sends email to admin + auto-reply to user.

### chatController.ts

- `getHistory(req, res)` — `{ roomId, before?, limit=50 }`.
- `getRooms(req, res)` — admin list.
- `deleteRoom(req, res)` — admin.
- `reportUser(req, res)` — creates report doc referencing message/user.

### newsletterController.ts

- `subscribe(req, res)` — `{ email }`; upserts `NewsletterSubscriber`.
- `getSubscribers(req, res)` — admin count + list.

---

## Routes

Each router in `routes/*.ts` chains:
1. `authMiddleware` / `optionalAuth` / `adminMiddleware` as needed.
2. Multer middleware for file endpoints.
3. Controller handler.

### routes/poster.ts (Admin — content generation)

- `GET /trends` — fetches Google News RSS for Morocco, parses titles/pubDates, dedupes, returns top 20.
- `GET /proxy?url=...` — CORS-safe image proxy (streams remote bytes with correct headers).
- `POST /generate-poster-image` — body `{ prompt, provider, model, size, n }`. Providers:
  - **ghost**: rotates across 70 `infip.pro` keys with round-robin, auto-blacklists failing keys; on all-fail falls back to **Pollinations** (free, no-key).
  - **dalle**: direct OpenAI `images/generations` with DALL-E 3, DALL-E 2, `gpt-image-1` as options.
- `POST /save-session` — persists a draft poster session (prompt, images, metadata).
- `GET /sessions` — list saved sessions.
- `DELETE /sessions/:topicId` / `PATCH /sessions/:topicId` — manage.
- `POST /save-poster-image` — writes generated image bytes to `data/posters/` and returns URL.

---

## Error & Logging Conventions

- All async handlers wrap in try/catch; on failure call `next(err)` → `errorHandler`.
- Business errors use `{ status: 4xx, message }`; unknown errors logged and returned as 500.
- `console.error` for server errors; `morgan` logs every request.

---

## Points & Premium Rules (source of truth)

| Action               | Points |
|----------------------|--------|
| Resource viewed      | +2     |
| Resource completed   | +10    |
| Resource unmarked    | -10    |

Free users: 1000 pts in a month → 14-day premium grant (via `maybeGrantPointsPremium`).

## Contribution Limits

| Plan    | Daily | Weekly |
|---------|-------|--------|
| Free    | 3     | 10     |
| Pro     | 6     | 20     |
| Premium | 12    | 40     |

Resets tracked via `contributionCount.windowStart` timestamps.
