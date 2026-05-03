export interface School {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
}

export interface Level {
    id: string;
    schoolId: string;
    title: string;
    description: string;
}

export interface Guidance {
    id: string;
    levelId: string;
    title: string;
    description: string;
}

export interface Subject {
    id: string;
    guidanceId: string;
    title: string;
    description: string;
    imageUrl?: string;
}

export interface LessonResource {
    title: string;
    url: string;
    type?: string;
}

export interface Lesson {
    id: string;
    subjectId: string;
    title: string;
    coursesPdf?: LessonResource[];
    videos?: LessonResource[];
    exercices?: LessonResource[];
    exams?: LessonResource[];
    resourses?: LessonResource[];
    createdAt: string;
    updatedAt: string;
}

// ─── Teacher System ───
export interface TeacherApplication {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    age: number;
    studyBranch: string;
    studyLevel: string;
    specialist: string;
    currentStand: string;
    targetLevelId: string;
    targetGuidanceId: string;
    targetSubjectId: string;
    videoUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewNote?: string;
    createdAt: string;
}

export interface TeacherRating {
    _id: string;
    userId: { _id: string; displayName: string; photoURL?: string };
    rating: number;
    comment?: string;
    createdAt: string;
}

export interface TeacherProfile {
    _id: string;
    userId: { _id: string; displayName: string; photoURL?: string };
    fullName: string;
    bio?: string;
    photoURL?: string;
    specialist: string;
    schoolName: string;
    guidanceId: string;
    subjectId: string;
    ratings: TeacherRating[];
    averageRating: number;
    totalRatings: number;
    totalStudents: number;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface TeacherRoom {
    _id: string;
    teacherId: { _id: string; displayName: string; photoURL?: string };
    teacherProfileId: { fullName: string; specialist: string; averageRating: number };
    name: string;
    description?: string;
    guidanceId: string;
    subjectId: string;
    roomCode: string;
    members: { _id: string; displayName: string; photoURL?: string }[];
    maxMembers: number;
    isActive: boolean;
    lastMessagePreview?: string;
    lastMessageAt?: string;
    createdAt: string;
}

export interface InstructorCourse {
    _id: string;
    instructorId: string;
    title: string;
    description?: string;
    videoUrl?: string;
    pdfUrl?: string;
    guidanceId: string;
    subjectId: string;
    viewCount: number;
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface InstructorRating {
    _id: string;
    userId: { _id: string; displayName: string; photoURL?: string };
    instructorId: string;
    rating: number;
    feedback?: string;
    createdAt: string;
}

export interface User {
    id: string;
    displayName: string;
    email: string;
    role: 'user' | 'admin' | 'instructor' | 'teacher';
    photoURL?: string;
    coverPhotoURL?: string;
    points?: number;
    totalGuidanceResources?: number;
    subscription: {
        plan: 'free' | 'premium' | 'pro';
        billingCycle: 'monthly' | 'yearly' | 'none';
        expiresAt?: string;
    };
    level?: {
        school: string;
        level: string;
        guidance: string;
    };
    phone?: string;
    nickname?: string;
    city?: string;
    age?: number;
    gender?: string;
    schoolName?: string;
    studyLocation?: string;
    progress: {
        totalLessons: number;
        completedLessons: number;
        learningTime: number;
        documentsOpened: number;
        videosWatched: number;
        usageTime: number;
        savedNews: string[];
        lessons?: any[];
        timeSpentHistory?: { date: string; minutes: number }[];
    };
    selectedPath?: {
        schoolId: string;
        levelId: string;
        guidanceId: string;
    };
    settings?: {
        notifications: boolean;
        theme: 'light' | 'dark' | 'system';
    };
}
