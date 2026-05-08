# Udarsy Web Frontend (udarsy-web) — Function Reference

- Framework: Next.js 16 (App Router) + React 19 + TypeScript
- Styling: Tailwind CSS + SCSS modules
- i18n: next-intl — locales `ar` (RTL), `fr`, `en`; messages in [udarsy-web/messages/](../udarsy-web/messages/)
- State: Context (Auth) + server components + ad-hoc hooks
- API: axios via [udarsy-web/src/lib/api.ts](../udarsy-web/src/lib/api.ts)

---

## Libraries ([src/lib/](../udarsy-web/src/lib/))

### api.ts
- Exports a configured `axios` instance pointing to `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api`).
- `withCredentials: true` so refresh cookies flow.
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage.
- Response interceptor: on 401 → clears token + triggers auth refresh flow.

### cache.ts
- `cached<T>(key, fetcher, ttlMs = 5 * 60_000)` — stale-while-revalidate:
  - Returns cached value immediately if present.
  - Revalidates in background if stale past TTL.
- `invalidateCache(prefix?)` — clears exact key or prefix.
- `prefetch(key, fetcher)` — warms cache without returning.

### constants.ts
- `SOCIALS` — `{ facebook, instagram, twitter, youtube, tiktok, linkedin }` URLs.
- `CONTACT` — `{ email, phone, whatsapp, address }`.
- `TEAM` — array of 6 members `{ name, role, photo, bio }`.
- `LINKS` — internal route constants.

### localeConfig.ts
- `locales = ['en', 'fr', 'ar']`.
- `defaultLocale = 'en'`.
- Helpers for RTL detection + locale-aware paths.

### Other utilities
- `format.ts` — date/number formatters (Intl).
- `validators.ts` — email, MAD price, etc.
- `auth.ts` (client) — token storage wrappers (localStorage + httpOnly cookie bridge).

---

## Types ([src/types/index.ts](../udarsy-web/src/types/index.ts))

Key interfaces:
- `School`, `Level`, `Guidance`, `Subject`, `Lesson` (+ nested `CoursePdf`, `Video`, `Exercice`, `Exam`, `Resource`).
- `User` — `displayName`, `email`, `role`, `subscriptionPlan`, `subscriptionExpiry`, `progress`, `points`, `affiliateCode`.
- `TeacherApplication`, `TeacherProfile`, `TeacherRoom` (with `inviteCode`, `members`, `memberLimit`).
- `InstructorCourse` — `title`, `videoUrl`, `pdfUrl`, `views`, `downloads`, `ratings`.
- `NewsArticle` — `title`, `image`, `rating.average`, `userRatings`, `qaList`.

---

## Contexts ([src/contexts/](../udarsy-web/src/contexts/))

### AuthContext.tsx — `AuthProvider`
Exposes `useAuth()`:
- `user: User | null`
- `loading: boolean`
- `login(email, password)` — calls `POST /auth/login`, stores token, sets user.
- `register(data)` — calls `POST /auth/register`.
- `googleLogin(credentialOrAccessToken, mode)` — `mode: 'id' | 'access'`.
- `logout()` — `POST /auth/logout`, clears localStorage + cookies.
- `checkAuth()` — throttled to 1/10s; calls `/user/profile`; populates `user`.
- `refreshUser()` — debounced 2s; re-fetches profile after mutations.
- `getPhotoURL(photo)` — resolves relative `/data/images/...` into absolute backend URL.
- `getResourceURL(url)` — same for resources.
- Renders full-screen loading overlay while initial auth check is in flight.

### Any other contexts
- `ThemeContext`, `LocaleContext`, `ToastContext` when present — consumed by layout.

---

## Services ([src/services/](../udarsy-web/src/services/))

### data.ts
- `getSchools()` — `GET /data/schools`, cached.
- `getLevels(schoolId)` — `GET /data/levels/:schoolId`.
- `getGuidances(levelId)` — `GET /data/guidances/:levelId`.
- `getSubjects(guidanceId)` — `GET /data/subjects/:guidanceId`.
- `getLessons(subjectId)` — `GET /data/lessons/:subjectId`.
- `getLessonById(lessonId)` — full lesson with resources.
- `prefetchSchools()` / `prefetchLevels(id)` — no-op stubs ready for real prefetch.

### progress.ts
- `trackResourceView(lessonId, resourceType, resourceId)` — fire-and-forget (errors swallowed).
- `updateResourceProgress(lessonId, resourceId, seconds)` — debounced 3 s.
- `markResourceComplete(lessonId, resourceId, completed)` — immediate.
- `toggleFavorite(lessonId)` — returns new state.
- `getUserFavorites()` — for /profile page.

### services.ts (school services)
- `getSchoolServices()` — list.
- `getSchoolServiceById(id)`.

### calendar.ts — `calendarService` object
- `get()` — user calendar.
- `sync(events, todos)` — bulk.
- `addEvent(event)`, `updateEvent(id, patch)`, `deleteEvent(id)`.
- `addTodo(todo)`, `toggleTodo(id)`, `deleteTodo(id)`.
- `getGlobalEvents()` — public.

### news.ts
- `getNews(page, limit, category?)`.
- `getNewsById(id)`.
- `rateNews(id, stars)`.
- `askQuestion(id, question)`.

### teacher.ts / instructor.ts
- Apply, fetch profile, list profiles, rate, manage rooms, upload courses.

---

## Pages ([src/app/](../udarsy-web/src/app/))

| Route                                  | File                                                      | Purpose |
|----------------------------------------|-----------------------------------------------------------|---------|
| `/`                                    | `page.tsx`                                                | Landing — hero, features, courses preview, chat demo, team, pricing |
| `/explore`                             | `explore/page.tsx`                                        | School → Level → Guidance → Subject browser |
| `/explore/subject/[subjectId]`         | `explore/subject/[subjectId]/page.tsx`                    | Lesson cards; fetches + caches lessons |
| `/lesson/[lessonId]`                   | `lesson/[lessonId]/page.tsx`                              | Full player: PDFs, videos (YouTube embed), exercises, exams; tracks view/progress/completion |
| `/lesson/[lessonId]/preview`           | `lesson/[lessonId]/preview/page.tsx`                      | Public lesson preview (no auth) |
| `/news`                                | `news/page.tsx`                                           | Paginated news grid |
| `/news/[id]`                           | `news/[id]/page.tsx`                                      | Article + Q&A + rating widget |
| `/contact`                             | `contact/page.tsx`                                        | Contact form → `POST /contact` |
| `/download`                            | `download/page.tsx`                                       | Resource download hub |
| `/contributions`                       | `contributions/page.tsx`                                  | Leaderboard + submit |
| `/profile`                             | `profile/page.tsx`                                        | Stats, photo upload, settings, logged lessons |
| `/profile/chat`                        | `profile/chat/page.tsx`                                   | Socket.io chat UI |
| `/teacher`                             | `teacher/page.tsx`                                        | Browse teachers |
| `/teacher/[id]`                        | `teacher/[id]/page.tsx`                                   | Profile + ratings |
| `/teacher/dashboard`                   | `teacher/dashboard/page.tsx`                              | Teacher dashboard (rooms, invites) |
| `/instructor/[id]`                     | `instructor/[id]/page.tsx`                                | Instructor profile + courses + ratings |
| `/instructor-dashboard`                | `instructor-dashboard/page.tsx`                           | Upload + manage courses |
| `/apply-instructor`                    | `apply-instructor/page.tsx`                               | Multi-step application (with demo video) |
| `/apply-teacher`                       | `apply-teacher/page.tsx`                                  | Verification documents submission |
| `/calendar`                            | `calendar/page.tsx`                                       | Interactive calendar; events + todos |
| `/report`                              | `report/page.tsx`                                         | Bug/feedback form |
| `/design-test`                         | `design-test/page.tsx`                                    | Internal only — design playground |
| `/not-found`                           | Next.js default `not-found.tsx`                           | 404 |

### Landing page (`/`) key components
- `HeroSection`, `FeaturesGrid`, `CoursesPreview`, `ChatDemo`, `TeamGrid`, `PricingCards`, `FooterCTA`.
- Preloads schools/news in `useEffect` via `prefetch`.

### Lesson page flow
1. `useParams()` → `lessonId`.
2. `getLessonById` (cached).
3. On mount: `trackResourceView(lessonId, type, resourceId)`.
4. While playing: `updateResourceProgress` every 3 s (debounced).
5. On 95%+ watched: `markResourceComplete(true)`.
6. Favorite button → `toggleFavorite`.

---

## Components ([src/components/](../udarsy-web/src/components/))

### PageTransition.tsx (new)
Wraps children in a fade/slide animation on route change. Uses `usePathname()` as key.

### FizzyButton (+ FizzyButton.css)
Stylized CTA used on hero + pricing.

### Common
- `Header`, `Footer`, `Navbar`, `LocaleSwitcher`, `Loader`, `ErrorBoundary`, `Modal`, `Toast`, `AvatarUpload`, `RatingStars`, `VideoPlayer`.

---

## i18n

- Wraps app with `NextIntlClientProvider` in root layout.
- Message files: `messages/{ar,fr,en}.json`.
- `useTranslations('namespace')` hook in components.
- RTL: root `<html dir="rtl" lang="ar">` when locale is `ar`.

---

## Global CSS / Theming

- Tailwind with custom theme (greens derived from `#3aaa6a` brand).
- CSS variables in `globals.css`: `--green`, `--green-50`, `--green-100`, `--dark`, `--border`, `--border-light`, `--text-primary`, `--text-secondary`.
- Subject card + lesson card styles in `explore/**/*.css`.
