import api from "@/lib/api";

/**
 * Debounce helper — only fires after `delay` ms of inactivity per key.
 * Used to batch rapid progress updates into single API calls.
 */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
function debouncedCall<T>(key: string, fn: () => Promise<T>, delay: number): void {
    const existing = debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    debounceTimers.set(key, setTimeout(() => {
        debounceTimers.delete(key);
        fn().catch(console.error);
    }, delay));
}

/** Track a resource view — fire-and-forget, no debounce needed (one-time per view) */
export const trackResourceView = (params: {
    lessonId: string;
    subjectId: string;
    resourceId: string;
    resourceType: string;
}) => {
    // Use sendBeacon-style: don't block UI, don't await
    api.post('/progress/track-view', params).catch(() => {});
};

/**
 * Update resource progress — debounced by 3s per resource.
 * Rapid timer ticks won't flood the server; only the last update is sent.
 */
export const updateResourceProgress = (params: {
    lessonId: string;
    subjectId?: string;
    resourceId: string;
    additionalTimeSpent: number;
    completionPercentage: number;
}) => {
    const key = `progress:${params.lessonId}:${params.resourceId}`;
    debouncedCall(key, () => api.post('/progress/update-progress', params), 3000);
};

/** Mark resource complete — immediate but fire-and-forget */
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
