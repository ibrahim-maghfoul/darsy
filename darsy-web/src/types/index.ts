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

export interface User {
    id: string;
    displayName: string;
    email: string;
    role: 'user' | 'admin';
    photoURL?: string;
    points?: number;
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
    };
    selectedPath?: {
        schoolId: string;
        levelId: string;
        guidanceId: string;
    };
}
