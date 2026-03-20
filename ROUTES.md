# API & Page Routes - Instructor System

## Backend Routes

### Instructor Management (`/api/instructor`)

#### Course Uploads
- **POST** `/api/instructor/courses/upload` - Upload a course (video or PDF)
  - Auth required: Yes
  - Body: FormData with `file` (video/PDF), `title`, `description`, `guidanceId`, `subjectId`
  - Returns: `{ message, course }`

- **GET** `/api/instructor/courses/me` - Get my courses
  - Auth required: Yes
  - Returns: `InstructorCourse[]`

- **GET** `/api/instructor/courses/:instructorId` - Get courses by instructor user ID
  - Auth required: No
  - Query params: `guidanceId`, `subjectId` (optional, filters)
  - Returns: `InstructorCourse[]`

- **GET** `/api/instructor/courses/:id/single` - Get single course details
  - Auth required: No
  - Returns: `InstructorCourse`

- **DELETE** `/api/instructor/courses/:id` - Delete a course
  - Auth required: Yes
  - Returns: `{ message }`

#### Instructor Profiles & Browse
- **GET** `/api/instructor` - List all approved instructors (public browse)
  - Auth required: No
  - Query params: `guidanceId`, `subjectId` (optional, filters)
  - Returns: `{ _id, displayName, photoURL, courseCount }[]`

- **GET** `/api/instructor/:instructorId` - Get instructor profile with all courses
  - Auth required: No
  - Returns: `{ user, profile, courses, courseCount }`

### Teacher Routes (Existing)

#### Applications
- **POST** `/api/teacher/apply` - Submit teacher application
  - Auth required: Yes
  - Multipart: video file + form data

- **GET** `/api/teacher/applications/me` - Get my applications
  - Auth required: Yes

- **GET** `/api/teacher/applications` - List all applications (admin)
  - Auth required: Yes (admin only)

- **PATCH** `/api/teacher/applications/:id/review` - Review application (admin)
  - Auth required: Yes (admin only)
  - Body: `{ status: 'approved'|'rejected', reviewNote }`

#### Teacher Profiles (for chat rooms)
- **GET** `/api/teacher/profiles` - List active teacher profiles

- **GET** `/api/teacher/profiles/:id` - Get teacher profile

- **GET** `/api/teacher/profile/me` - Get my teacher profile
  - Auth required: Yes

- **PUT** `/api/teacher/profile` - Create/update teacher profile
  - Auth required: Yes

- **POST** `/api/teacher/profiles/:id/rate` - Rate a teacher

#### Teacher Rooms
- **POST** `/api/teacher/rooms` - Create a chat room
  - Auth required: Yes (teacher only)

- **GET** `/api/teacher/rooms/me` - Get my rooms

- **GET** `/api/teacher/rooms/joined` - Get rooms I joined

- **GET** `/api/teacher/rooms/:id` - Get room details

- **POST** `/api/teacher/rooms/join/:inviteCode` - Join room via invite code

- **DELETE** `/api/teacher/rooms/:id` - Delete/deactivate room

---

## Frontend Routes

### Instructor Pages
- **GET** `/instructors` - Browse all approved instructors
  - Lists: instructor name, photo, course count

- **GET** `/instructor/[id]` - Individual instructor profile
  - Shows: instructor bio, all courses (with download links)

### Teacher Pages (Existing)
- **GET** `/teacher/[id]` - Teacher profile (chat room teacher)
  - Shows: profile, ratings, join room button

- **GET** `/teacher/dashboard` - Teacher dashboard
  - Create rooms, manage invite codes, view students

### Application Pages
- **GET** `/apply-teacher` - Apply as instructor (multi-step form)
  - Step 1: Personal info
  - Step 2: Qualifications
  - Step 3: Choose course (cascade: school → level → guidance → subject)
  - Step 4: Upload demo video

- **GET** `/profile` - User profile
  - Shows: approved instructor card (if role = 'instructor')
  - Quick actions: calendar, contributions, services, share, invite friends
  - Contribute resources, grades calculator, saved news

---

## Data Structure

### InstructorCourse (MongoDB)
```typescript
{
  _id: ObjectId
  instructorId: ObjectId (User ID)
  title: string
  description?: string
  videoUrl?: string (path: /data/videos/applications/{userId}/...)
  pdfUrl?: string (path: /data/documents/{userId}/...)
  guidanceId: string
  subjectId: string
  createdAt: Date
  updatedAt: Date
}
```

### File Storage Paths
- **Application demo videos**: `data/videos/applications/{userId}.{ext}`
- **Instructor course videos**: `data/videos/applications/{userId}/{uuid}.{ext}`
- **Instructor course PDFs**: `data/documents/{userId}/{uuid}.pdf`

---

## User Roles

- **user**: Regular student, no special permissions
- **admin**: Full platform access, can review applications
- **instructor**: Approved applicant, can upload courses, has public profile
- **teacher**: Can create chat rooms, invite students via codes

> Note: Instructor and Teacher are **separate, mutually exclusive** roles based on the user's implementation choice.
