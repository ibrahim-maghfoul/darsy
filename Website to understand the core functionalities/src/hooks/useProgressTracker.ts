import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateResourceProgress } from '@/lib/firestore';

interface UseProgressTrackerOptions {
    lessonId: string;
    resourceId: string;
    resourceType: 'pdf' | 'video' | 'exercise' | 'exam' | 'resource';
    autoTrack?: boolean; // If true, automatically track time
    saveInterval?: number; // How often to save progress (in seconds), default 30
}

export function useProgressTracker({
    lessonId,
    resourceId,
    resourceType,
    autoTrack = true,
    saveInterval = 30,
}: UseProgressTrackerOptions) {
    const { user } = useAuth();
    const [timeSpent, setTimeSpent] = useState(0);
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [isTracking, setIsTracking] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastSaveTimeRef = useRef(0);
    const unsavedTimeRef = useRef(0);

    // Start tracking
    const startTracking = () => {
        if (!user || isTracking) return;
        setIsTracking(true);
    };

    // Stop tracking
    const stopTracking = () => {
        setIsTracking(false);
    };

    // Manually update completion percentage
    const updateCompletion = (percentage: number) => {
        setCompletionPercentage(Math.min(100, Math.max(0, percentage)));
    };

    // Save progress to Firestore
    const saveProgress = async (forceSave = false) => {
        if (!user) return;

        const timeToSave = unsavedTimeRef.current;
        if (timeToSave === 0 && !forceSave) return;

        try {
            await updateResourceProgress(
                user.uid,
                lessonId,
                resourceId,
                timeToSave,
                completionPercentage
            );
            unsavedTimeRef.current = 0;
            lastSaveTimeRef.current = timeSpent;
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    // Effect: Track time while isTracking is true
    useEffect(() => {
        if (!isTracking || !autoTrack) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeSpent(prev => {
                const newTime = prev + 1;
                unsavedTimeRef.current += 1;

                // Auto-save every saveInterval seconds
                if (unsavedTimeRef.current >= saveInterval) {
                    saveProgress();
                }

                return newTime;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isTracking, autoTrack, saveInterval]);

    // Effect: Handle page visibility (pause when tab hidden)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTracking();
            } else if (autoTrack) {
                startTracking();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [autoTrack]);

    // Effect: Save progress before page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (unsavedTimeRef.current > 0) {
                // Note: This is best-effort. Some browsers may not wait for the async call
                saveProgress(true);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Effect: Auto-start tracking if autoTrack is enabled
    useEffect(() => {
        if (autoTrack && user) {
            startTracking();
        }

        return () => {
            stopTracking();
            // Save any unsaved progress when unmounting
            if (unsavedTimeRef.current > 0) {
                saveProgress(true);
            }
        };
    }, [autoTrack, user]);

    return {
        timeSpent,
        completionPercentage,
        isTracking,
        startTracking,
        stopTracking,
        updateCompletion,
        saveProgress: () => saveProgress(true),
    };
}
