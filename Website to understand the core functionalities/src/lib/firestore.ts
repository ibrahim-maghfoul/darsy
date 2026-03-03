import api from './api';

export interface UserData {
    displayName: string;
    email: string;
    photoURL?: string;
    createdAt: any;
    level?: {
        school: string;
        level: string;
        guidance: string;
    };
    isPremium: boolean;
    progress: {
        totalLessons: number;
        completedLessons: number;
        learningTime: number;
        documentsOpened: number;
        videosWatched: number;
        usageTime: number;
        favorites: string[];
        bookmarks: string[];
        savedNews: string[];
    };
    settings: {
        notifications: boolean;
        theme: 'light' | 'dark' | 'system';
    };
    selectedPath?: {
        schoolId: string;
        levelId: string;
        guidanceId: string;
    };
    lessonProgress?: {
        [lessonId: string]: {
            lessonId: string;
            subjectId: string;
            isFavorite: boolean;
            lastAccessed: any;
            totalTimeSpent: number;
            resources: {
                [resourceId: string]: {
                    resourceId: string;
                    resourceType: 'pdf' | 'video' | 'exercise' | 'exam' | 'resource';
                    timeSpent: number;
                    lastAccessed: any;
                    isCompleted: boolean;
                    completionPercentage: number;
                };
            };
            completedResourcesCount: number;
            totalResourcesCount: number;
        };
    };
}

// User Profile Management
export const getUserDocument = async (userId: string): Promise<UserData | null> => {
    try {
        const response = await api.get('/user/profile');
        return response.data;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const updateUserDocument = async (userId: string, data: Partial<UserData>) => {
    try {
        await api.put('/user/profile', data);
    } catch (error) {
        console.error("Error updating user profile:", error);
    }
};

// Progress Tracking Functions

export const trackResourceView = async (
    userId: string,
    lessonId: string,
    subjectId: string,
    resourceId: string,
    resourceType: 'pdf' | 'video' | 'exercise' | 'exam' | 'resource'
) => {
    try {
        await api.post('/progress/track-view', {
            lessonId,
            subjectId,
            resourceId,
            resourceType
        });
    } catch (error) {
        console.error("Error tracking resource view:", error);
    }
};

export const updateResourceProgress = async (
    userId: string,
    lessonId: string,
    resourceId: string,
    additionalTimeSpent: number,
    completionPercentage: number
) => {
    try {
        await api.post('/progress/update-progress', {
            lessonId,
            resourceId,
            additionalTimeSpent,
            completionPercentage
        });
    } catch (error) {
        console.error("Error updating resource progress:", error);
    }
};

export const markResourceComplete = async (
    userId: string,
    lessonId: string,
    subjectId: string,
    resourceId: string,
    resourceType: 'pdf' | 'video' | 'exercise' | 'exam' | 'resource',
    isCompleted: boolean = true
) => {
    try {
        await api.post('/progress/mark-complete', {
            lessonId,
            subjectId,
            resourceId,
            resourceType,
            isCompleted
        });
    } catch (error) {
        console.error("Error marking resource complete:", error);
    }
};

export const toggleLessonFavorite = async (
    userId: string,
    lessonId: string,
    subjectId: string
) => {
    try {
        const response = await api.post('/progress/toggle-favorite', {
            lessonId,
            subjectId
        });
        return response.data.isFavorite;
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return false;
    }
};

export const getFavoriteLessons = async (userId: string) => {
    try {
        const response = await api.get('/progress/favorites');
        return response.data;
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};

export const getSubjectProgress = async (userId: string, subjectId: string): Promise<{
    completedResources: number;
    totalResources: number;
    progressPercentage: number;
}> => {
    try {
        const response = await api.get(`/progress/subject/${subjectId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching subject progress:", error);
        return { completedResources: 0, totalResources: 0, progressPercentage: 0 };
    }
};

// Functions below might not have direct API equivalents yet or need adaptation
// For now, keeping them as stubs or mapping to generic update if possible

export const createUserDocument = async (userId: string, data: Partial<UserData>) => {
    // Handled by registration usually
    console.warn("createUserDocument is deprecated, use auth/register");
};

export const deleteUserDocument = async (userId: string) => {
    // Implement delete account endpoint if needed
    console.warn("deleteUserDocument not implemented in frontend API client");
};

export const updateUserProgress = async (userId: string, progress: Partial<UserData['progress']>) => {
    // Could map to generic profile update or specific progress endpoint
    // For now, mapping to update profile
    await updateUserDocument(userId, { progress: progress as any });
};

export const trackDocumentOpened = async (userId: string, documentId: string) => {
    // Specific implementation might be needed in backend
    console.log("trackDocumentOpened not fully implemented via API yet");
};

export const updateUsageTime = async (userId: string, additionalMinutes: number) => {
    // Logic might be moved to backend
    console.log("updateUsageTime not fully implemented via API yet");
};

// Favorites/Bookmarks generic handlers - map to specific endpoints or generic user update
export const addToFavorites = async (userId: string, itemId: string) => {
    // use specific favorite endpoint if possible
    console.log("addToFavorites generic not implemented");
};

export const removeFromFavorites = async (userId: string, itemId: string) => {
    console.log("removeFromFavorites generic not implemented");
};

export const addBookmark = async (userId: string, itemId: string) => { console.log("addBookmark not implemented"); };
export const removeBookmark = async (userId: string, itemId: string) => { console.log("removeBookmark not implemented"); };
export const saveNews = async (userId: string, newsId: string) => { console.log("saveNews not implemented"); };
export const removeSavedNews = async (userId: string, newsId: string) => { console.log("removeSavedNews not implemented"); };
export const getLessonProgress = async (userId: string, lessonId: string) => {
    try {
        const response = await api.get(`/progress/lesson/${lessonId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching lesson progress:", error);
        return null;
    }
};
export const updateLessonResourceCount = async (userId: string, lessonId: string, subjectId: string, totalCount: number) => {
    try {
        await api.post('/progress/update-resource-count', {
            lessonId,
            subjectId,
            totalCount
        });
    } catch (error) {
        console.error("Error updating lesson resource count:", error);
    }
};
