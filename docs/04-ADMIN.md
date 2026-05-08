# Udarsy Admin Panel (udarsy-admin) — Function Reference

- Framework: React 19 + Vite
- Routing: React Router (BrowserRouter) with lazy-loaded pages + Suspense
- Auth: separate admin-only `AuthContext`, stores JWT in localStorage
- AI: multi-provider LLM fallback (Nebius → OpenRouter → Gemini) for content-creation tools

---

## Entry ([src/App.jsx](../udarsy-admin/src/App.jsx))

```
<BrowserRouter>
  <AuthProvider>
    <ProtectedRoute>
      <MainApp />   // Layout + Suspense + Routes
    </ProtectedRoute>
  </AuthProvider>
</BrowserRouter>
```

- `PageLoader` — spinner fallback for Suspense.
- `SettingsPage` — inline placeholder ("Admin panel settings coming soon").
- `LessonsWithNav`, `NewsWithNav` — compatibility shims that pass `setActiveTab` (translated via `TAB_ROUTES`) into legacy pages that still expect tab-based nav.

### TAB_ROUTES map
Maps legacy tab IDs to router paths (dashboard → `/`, `instructor-apps` → `/instructor-apps`, etc.). Used by the shim components above.

---

## Routes ([App.jsx](../udarsy-admin/src/App.jsx))

| Path                          | Component              | Purpose |
|-------------------------------|------------------------|---------|
| `/`                           | `Dashboard`            | Overview stats (users, content, activity) |
| `/users`                      | `UsersPage`            | CRUD users, roles, subscriptions |
| `/instructor-apps`            | `TeacherApplications`  | Instructor applications (legacy name) |
| `/teacher-verifications`      | `TeacherVerifications` | Verify teacher documents |
| `/instructor-courses`         | `InstructorCourses`    | Moderate uploaded courses |
| `/content`                    | `Lessons` (via shim)   | Curriculum hierarchy editor |
| `/news`                       | `NewsManager` (shim)   | Create/edit/delete news articles |
| `/services`                   | `ServicesPage`         | School services |
| `/chat-rooms`                 | `ChatRoomsPage`        | Monitor/delete chat rooms |
| `/contributions`              | `ContributionsPage`    | Approve/reject user contributions |
| `/feedback`                   | `FeedbackPage`         | User reports/feedback |
| `/upload`                     | `BatchUpload`          | Bulk resource upload |
| `/database`                   | `FirebaseUpload`       | Firebase sync view |
| `/mongo-sync`                 | `MongoSync`            | Database sync tools |
| `/tools`                      | `YouTubeConverter`     | Convert YouTube links → embed format |
| `/calendar`                   | `CalendarPage`         | Manage global events |
| `/poster-generation`          | `PosterGeneration`     | AI poster generator (Ghost/DALL-E) |
| `/launch-ideas`               | `LaunchIdeas`          | AI brainstorm for marketing launches |
| `/content-management`         | `ContentManagement`    | Draft-review-publish flow |
| `/analytics`                  | `ContentAnalytics`     | Content performance analytics |
| `/logo-generator`             | `LogoGenerator`        | AI logo concepts |
| `/settings`                   | `SettingsPage`         | Placeholder |
| `*`                           | `<Navigate to="/" />`  | 404 fallback |

---

## Sidebar ([src/components/Sidebar.jsx](../udarsy-admin/src/components/Sidebar.jsx))

Sections (`SECTIONS` array):
- **Overview** — Dashboard, Users
- **Applications** — Instructor Apps, Teacher Verifs, Courses Review
- **Content** — Curriculum, News, Services
- **Community** — Chat Rooms, Contributions, Reports & Feedback
- **Content Creation** — Poster Generation, Launch Ideas, Content Management, Analytics, Logo Generator
- **Tools** — Batch Upload, Firebase View, Sync to Mongo, YouTube Tool, Global Events
- **System** — Settings

Each item uses a `lucide-react` icon. The sidebar is a fixed-position `<aside>` with:
- Mobile overlay (`sidebar-overlay-el`) shown under 1024 px via media query.
- `NavLink` auto-applies `sidebar-link--active` class for the current route.
- Footer: `Sign Out` button wired to `logout()` from `useAuth()`.

---

## Layout ([src/components/Layout.jsx](../udarsy-admin/src/components/Layout.jsx))

- Renders `<Sidebar>` + top bar + `<main>{children}</main>`.
- Mobile: hamburger toggles `isOpen`.
- Active tab/title inferred from URL (via `useLocation`).

---

## Auth ([src/context/AuthContext.jsx](../udarsy-admin/src/context/AuthContext.jsx))

Exposes `useAuth()`:
- `user` — admin user object from backend.
- `login(email, password)` — calls `POST /auth/login`; rejects if `role !== 'admin'`; stores:
  - `udarsy_admin_user` — serialized user
  - `udarsy_backend_token` — JWT access token
- `logout()` — clears localStorage + state.
- `loading` — gate for protected content.

`ProtectedRoute` reads the context; if unauthenticated, renders `Login` page (`src/pages/Login.jsx`).

---

## Utilities ([src/utils/](../udarsy-admin/src/utils/))

### adminFetch.js
- `BASE_URL = 'http://localhost:5000/api'`.
- `adminFetch(path, options)` — wraps `fetch` with:
  - `Authorization: Bearer ${localStorage.udarsy_backend_token}`.
  - JSON content-type when body is an object.
  - `res.ok` → returns parsed JSON; otherwise throws `Error(body.error || res.statusText)`.

### aiService.js — multi-provider LLM fallback
Used by PosterGeneration, LaunchIdeas, LogoGenerator, ContentManagement.

- `blackListProvider(provider)` — marks provider as failed for this session.
- `resetProviderBlacklist()` — clears blacklist when all providers fail.
- `makeLLMRequest(messages, options)`:
  - `options.forceProvider` — pin to one of `gemini`, `nebius`, `openrouter`.
  - `options.keys` — `{ gemini?, nebius?, openrouter? }`.
  - `options.addLog(msg)` — optional logging callback.
  - `options.setCurrentProvider(name)` — UI indicator callback.
  - `options.config` — `{ temperature=0.85, maxTokens=2048 }`.
  - Default provider order (auto): `['nebius', 'openrouter']` (Gemini omitted from default rotation).
  - Models used:
    - Gemini: `gemini-2.0-flash` via `v1beta/models/...:generateContent`.
    - Nebius: `meta-llama/Llama-3.3-70B-Instruct`.
    - OpenRouter: `openai/gpt-4o-mini`.
  - Per-provider request builds the appropriate body/headers, extracts `choices[0].message.content`, throws on empty.
  - On provider error: blacklists it, moves to next; recurses after `resetProviderBlacklist` if all fail in one pass.
  - Final return shape: `{ choices: [{ message: { content } }], provider }`.

Other util files (imageService, keys loader, etc.) are imported by individual pages as needed.

---

## Pages ([src/pages/](../udarsy-admin/src/pages/))

### Dashboard.jsx
- Fetches counts via `adminFetch('/user/admin/stats')` (or composed calls).
- Renders cards for users, lessons, news, contributions, feedback, chat rooms.

### UsersPage.jsx
- Paginated table with search.
- Actions: change role, set subscription (plan + cycle + expiry), delete.

### TeacherApplications.jsx / TeacherVerifications.jsx
- List with filters (status=pending/approved/rejected).
- Row drawer: details + `Approve` / `Reject` with `reviewNotes`.
- Approve application → backend promotes user role.

### InstructorCourses.jsx
- Admin view: list courses with search/filter.
- Actions: view, delete, flag.

### Lessons.jsx (curriculum editor)
- Hierarchical navigator: School → Level → Guidance → Subject → Lesson.
- Resource tabs inside a lesson: PDFs / Videos / Exercises / Exams / Resources.
- Add/edit/delete for every level; uploads resources (PDF) via `POST /data/...`.

### NewsManager.jsx
- Article CRUD; rich text field for `content`; tag/category selector.
- Q&A moderation: list questions, submit answer.

### ServicesPage.jsx
- CRUD for `schoolservices`.

### ChatRoomsPage.jsx
- Lists all rooms; delete action; inspect recent messages.

### ContributionsPage.jsx
- List pending/approved/rejected contributions.
- Approve attaches file to lesson resources; reject soft-marks.

### FeedbackPage.jsx
- View reports (bug/suggestion/feedback), change status.

### BatchUpload.jsx
- Parses CSV/JSON of lessons + resources and calls backend create endpoints in sequence.

### FirebaseUpload.jsx
- Tooling to mirror local data into Firebase (for mobile app sync).

### MongoSync.jsx
- Sync orchestration between environments.

### YouTubeConverter.jsx
- Converts `watch?v=...` / `youtu.be/...` URLs into embed format and copies to clipboard.

### CalendarPage.jsx
- Global-event editor (userId: null events).

### PosterGeneration.jsx (new)
- Fetches `/api/poster/trends` → picks topic.
- Uses `aiService.makeLLMRequest` to craft image prompt.
- Calls `/api/poster/generate-poster-image` (Ghost default, DALL-E optional).
- Renders grid of generated images with Save/Reject actions; persists via `/save-session` + `/save-poster-image`.

### LaunchIdeas.jsx (new)
- AI-generates marketing launch concepts via `makeLLMRequest({ forceProvider: 'nebius' })`.

### ContentManagement.jsx (new)
- Queue of AI-drafted posts: review, edit, schedule.

### ContentAnalytics.jsx (new)
- Aggregates views/downloads/ratings.

### LogoGenerator.jsx (new)
- Produces logo brief via LLM, then sends to image gen. Provider pinned to `nebius` (Gemini quota exhausted).

### Login.jsx
- Email + password → `login()` from AuthContext → redirect to `/`.

---

## Styling / UX conventions

- CSS variables in `src/index.css`: `--green`, `--green-50/100`, `--dark`, `--text-primary`, `--text-secondary`, `--border`, `--border-light`, `--sidebar-width`.
- Card style: white bg + 1 px border + 12 px radius + subtle shadow.
- All actions confirm with `window.confirm()` before destructive calls.
- Lucide icons only (no mixed icon libs).
