# Darsy Database — Mongoose Models

All models in [darsy-backend/src/models/](../darsy-backend/src/models/).
MongoDB connection: `darsy-backend/src/config/database.ts` — maxPoolSize 10, serverSelectionTimeoutMS 5000.

---

## User (`users`)

```
{
  _id: ObjectId,
  displayName: string,
  email: string (unique, indexed),
  password: string (bcrypt hash — select:false),
  refreshTokenHash: string (SHA-256, select:false),
  photoURL: string | null,
  role: 'user' | 'teacher' | 'instructor' | 'admin',
  school: string | null,
  level: string | null,
  guidance: string | null,

  subscription: {
    plan: 'free' | 'pro' | 'premium',
    cycle: 'monthly' | 'yearly' | null,
    startedAt: Date,
    expiresAt: Date | null
  },

  progress: {
    lessons: [{
      lessonId: string,
      viewedResources: [string],
      completedResources: [string],
      timeSpentSeconds: number,
      lastViewedAt: Date
    }],
    timeSpentHistory: [{ date: Date, seconds: number }] // 7-day window
  },

  favoriteLessons: [string],
  savedNews: [string],

  points: number (indexed),
  pointsMonth: { month: string, earned: number, premiumGrantedAt: Date | null },

  affiliateCode: string (unique, indexed),
  referredBy: string | null,
  referralCount: number,

  contributionCount: {
    daily: number, weekly: number,
    dayWindowStart: Date, weekWindowStart: Date
  },

  calendar: {
    events: [CalendarEvent],
    todos: [CalendarTodo]
  },

  settings: {
    notifications: { email: boolean, push: boolean },
    theme: 'light' | 'dark' | 'system',
    language: 'ar' | 'fr' | 'en'
  },

  lastLogin: Date,
  createdAt, updatedAt
}
```

**Indexes**: `email`, `role`, `points`, `affiliateCode`, `subscription.plan`, `referredBy`.
**Virtuals**: `isPremium` = plan in `['premium', 'pro']`.
**Pre-save hook**: On first save, seeds 7 zeroed entries in `timeSpentHistory`.

---

## Curriculum

### School (`schools`)
```
{ _id, title, createdAt, updatedAt }
```

### Level (`levels`)
```
{ _id, title, schoolId (ref School), createdAt, updatedAt }
```

### Guidance (`guidances`)
```
{ _id, title, levelId, stats?: { subjects, lessons }, createdAt, updatedAt }
```

### Subject (`subjects`)
```
{ _id, title, guidanceId, imageUrl, createdAt, updatedAt }
```

### Lesson (`lessons`)
Custom **string** `_id` (e.g. `lesson-arab-bac-01`).

```
{
  _id: string,
  title: string,
  subjectId: string,
  coursesPdf: [{ _id, title, url }],
  videos:    [{ _id, title, url, thumbnail?, durationSeconds? }],
  exercices: [{ _id, title, url }],
  exams:     [{ _id, title, url, year? }],
  resourses: [{ _id, title, url, type? }],
  resourceCount: number, // aggregated counter
  createdAt, updatedAt
}
```

---

## News (`news`)
Custom **string** `_id` (scraper-assigned sequential).

```
{
  _id: string,
  title: string,
  description: string,
  content: string (HTML),
  image: string,
  category: string,
  tags: [string],
  viewCount: number,

  rating: { average: number, count: number, total: number },
  userRatings: [{ userId: ObjectId, stars: 1..5, at: Date }],

  qaList: [{
    _id, question: string, userId: ObjectId, askedAt: Date,
    answer?: string, answeredAt?: Date, answeredBy?: ObjectId
  }],

  createdAt, updatedAt
}
```

**Indexes**: text on `title + description`, `category`, `createdAt -1`.

---

## Contribution (`contributions`)

```
{
  _id, title, url?, file?, subjectId, lessonId,
  userId: ObjectId (User),
  status: 'pending' | 'approved' | 'rejected',
  reviewNotes?: string,
  createdAt, updatedAt
}
```

---

## Feedback (`feedback`)

```
{
  _id, type: 'bug' | 'suggestion' | 'feedback',
  title, description,
  userId: ObjectId (User),
  status: 'pending' | 'reviewed' | 'resolved',
  createdAt, updatedAt
}
```

---

## Teacher system

### TeacherApplication (`teacherapplications`)
```
{
  _id, userId, fullName, email, age,
  specialization, level, guidance, subject,
  demoVideoUrl: string,
  status: 'pending' | 'approved' | 'rejected',
  reviewNotes?: string,
  reviewedBy?: ObjectId,
  createdAt, updatedAt
}
```

### TeacherVerification (`teacherverifications`)
```
{
  _id, userId,
  documents: [{ url, type, uploadedAt }],
  status: 'pending' | 'approved' | 'rejected',
  reviewNotes?, reviewedBy?,
  createdAt, updatedAt
}
```

### TeacherProfile (`teacherprofiles`)
```
{
  _id, userId (unique),
  bio, subjects: [string], ratesMAD: { oneOnOne: number, group: number },
  availability: string,
  photoURL, coverURL,
  ratings: [{ userId, stars, comment?, at }],
  ratingAvg: number, ratingCount: number,
  createdAt, updatedAt
}
```

### TeacherRoom (`teacherrooms`)
```
{
  _id, name, description,
  guidance, subject,
  ownerId: ObjectId (User),
  inviteCode: string (unique, 8 chars),
  members: [ObjectId],
  memberLimit: number,
  createdAt, updatedAt
}
```

---

## Instructor system

### InstructorCourse (`instructorcourses`)
```
{
  _id, title, description,
  videoUrl: string, pdfUrl: string,
  guidanceId, subjectId,
  instructorId: ObjectId (User),
  views: number, downloads: number,
  ratings: [{ userId, stars, comment, at }],
  ratingAvg: number, ratingCount: number,
  createdAt, updatedAt
}
```

---

## Chat

### ChatRoom (`chatrooms`)
```
{
  _id,
  guidanceId: string, levelId: string,
  lastMessage: { content, senderId, at } | null,
  messageCount: number,
  createdAt, updatedAt
}
```
Compound unique index: `{ guidanceId, levelId }`.

### Message (`chatmessages`)
```
{
  _id,
  roomId: ObjectId (ChatRoom),
  senderId: ObjectId (User),
  content: string,
  replyTo: ObjectId | null,
  reactions: [{ userId, emoji }],
  createdAt
}
```

---

## Calendar

### CalendarEvent (embedded in User.calendar or `calendarevents` for global)
```
{
  _id, title, description?, date, endDate?,
  category: string, color: string,
  userId: ObjectId | null   // null = global
}
```

### CalendarTodo (embedded in User.calendar)
```
{ _id, title, done: boolean, date?: Date }
```

---

## Newsletter

### NewsletterSubscriber (`newslettersubscribers`)
```
{ _id, email (unique), subscribedAt: Date }
```

---

## SchoolService (`schoolservices`)
```
{
  _id, title, description, icon, category,
  contentBlocks: [{ type, value }],
  externalUrl?: string,
  active: boolean, order: number,
  createdAt, updatedAt
}
```

---

## Conventions

- Timestamps enabled by default (`{ timestamps: true }`).
- ObjectId refs use Mongoose `ref`.
- Lesson and News use **string** `_id` to preserve scraper-assigned, human-readable IDs.
- Sensitive fields (`password`, `refreshTokenHash`) have `select: false` — must be explicitly selected when needed.
