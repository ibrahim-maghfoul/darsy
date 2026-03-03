export interface School {
    id: string;
    title: string;
    imageUrl?: string; // If available
}

export interface Level {
    id: string;
    schoolId: string;
    title: string;
}

export interface Guidance {
    id: string;
    levelId: string;
    title: string;
}

export interface Subject {
    id: string;
    guidanceId: string;
    title: string;
    imageUrl?: string;
}

export interface LessonResource {
    title: string;
    url: string;
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
}

export interface ResourceProgress {
    resourceId: string;
    resourceType: 'pdf' | 'video' | 'exercise' | 'exam' | 'resource';
    timeSpent: number; // in seconds
    lastAccessed: any; // Firestore timestamp
    isCompleted: boolean;
    completionPercentage: number; // 0-100
}

export interface LessonProgress {
    lessonId: string;
    subjectId: string;
    isFavorite: boolean;
    lastAccessed: any;
    totalTimeSpent: number; // in seconds
    resources: { [resourceId: string]: ResourceProgress };
    completedResourcesCount: number;
    totalResourcesCount: number;
}
