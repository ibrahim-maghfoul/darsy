import api from "@/lib/api";

export const trackResourceView = async (params: {
    lessonId: string;
    subjectId: string;
    resourceId: string;
    resourceType: string;
}) => {
    try {
        await api.post('/progress/track-view', params);
    } catch (error) {
        console.error("Error tracking view:", error);
    }
};

export const updateResourceProgress = async (params: {
    lessonId: string;
    resourceId: string;
    additionalTimeSpent: number;
    completionPercentage: number;
}) => {
    try {
        await api.post('/progress/update-progress', params);
    } catch (error) {
        console.error("Error updating progress:", error);
    }
};

export const markResourceComplete = async (params: {
    lessonId: string;
    subjectId: string;
    resourceId: string;
    resourceType: string;
    isCompleted: boolean;
}) => {
    try {
        await api.post('/progress/mark-complete', params);
    } catch (error) {
        console.error("Error marking complete:", error);
    }
};

export const toggleFavorite = async (lessonId: string, subjectId: string) => {
    try {
        const res = await api.post('/progress/toggle-favorite', { lessonId, subjectId });
        return res.data.isFavorite;
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return false;
    }
};

export const getUserFavorites = async () => {
    try {
        const res = await api.get('/progress/favorites');
        return res.data;
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};
