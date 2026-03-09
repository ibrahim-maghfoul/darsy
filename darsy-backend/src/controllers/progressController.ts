// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Lesson } from '../models/Lesson';
import { Subject } from '../models/Subject';

export class ProgressController {
    private static async getLessonTotalResources(lessonId: string): Promise<number> {
        try {
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) return 0;
            return (lesson.coursesPdf?.length || 0) +
                (lesson.videos?.length || 0) +
                (lesson.exercices?.length || 0) +
                (lesson.exams?.length || 0) +
                (lesson.resourses?.length || 0);
        } catch (e) {
            return 0;
        }
    }

    // Track resource view
    static async trackResourceView(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId, subjectId, resourceId, resourceType } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            if (!user.progress) {
                user.progress = { totalLessons: 0, completedLessons: 0, learningTime: 0, documentsOpened: 0, videosWatched: 0, usageTime: 0, savedNews: [], lessons: [] };
            }
            if (!user.progress.lessons) {
                user.progress.lessons = [];
            }

            let lessonIndex = user.progress.lessons.findIndex(l => l.lessonId === lessonId);
            let lessonProgress;

            if (lessonIndex === -1) {
                lessonProgress = {
                    lessonId,
                    subjectId,
                    isFavorite: false,
                    lastAccessed: new Date(),
                    totalTimeSpent: 0,
                    completedResources: [],
                    totalResourcesCount: await ProgressController.getLessonTotalResources(lessonId),
                };
                user.progress.lessons.push(lessonProgress);
                lessonIndex = user.progress.lessons.length - 1;
            } else {
                lessonProgress = user.progress.lessons[lessonIndex];
                lessonProgress.lastAccessed = new Date();
            }

            if (resourceType === 'pdf') {
                user.progress.documentsOpened = (user.progress.documentsOpened || 0) + 1;
            } else if (resourceType === 'video') {
                user.progress.videosWatched = (user.progress.videosWatched || 0) + 1;
            }

            user.markModified('progress');
            await user.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Track resource view error:', error);
            res.status(500).json({ error: 'Failed to track resource view' });
        }
    }

    // Update resource progress
    static async updateResourceProgress(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId, resourceId, additionalTimeSpent, completionPercentage } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            if (!user.progress) {
                user.progress = { totalLessons: 0, completedLessons: 0, learningTime: 0, documentsOpened: 0, videosWatched: 0, usageTime: 0, savedNews: [], lessons: [] };
            }
            if (!user.progress.lessons) {
                user.progress.lessons = [];
            }

            const lessonIndex = user.progress.lessons.findIndex(l => l.lessonId === lessonId);
            let lessonProgress;

            if (lessonIndex === -1) {
                lessonProgress = {
                    lessonId,
                    subjectId: req.body.subjectId || '',
                    isFavorite: false,
                    lastAccessed: new Date(),
                    totalTimeSpent: additionalTimeSpent,
                    completedResources: [],
                    totalResourcesCount: await ProgressController.getLessonTotalResources(lessonId),
                };
                user.progress.lessons.push(lessonProgress);
            } else {
                lessonProgress = user.progress.lessons[lessonIndex];
                lessonProgress.totalTimeSpent = (lessonProgress.totalTimeSpent || 0) + additionalTimeSpent;
                lessonProgress.lastAccessed = new Date();
            }

            let totalUsageSeconds = 0;
            user.progress.lessons.forEach(lp => {
                totalUsageSeconds += lp.totalTimeSpent || 0;
            });

            user.progress.usageTime = Math.round(totalUsageSeconds / 60);
            user.progress.learningTime = user.progress.usageTime;

            user.markModified('progress');
            await user.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Update resource progress error:', error);
            res.status(500).json({ error: 'Failed to update resource progress' });
        }
    }

    // Mark resource complete
    static async markResourceComplete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId, subjectId, resourceId, resourceType, isCompleted } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            if (!user.progress) {
                user.progress = { totalLessons: 0, completedLessons: 0, learningTime: 0, documentsOpened: 0, videosWatched: 0, usageTime: 0, savedNews: [], lessons: [] };
            }
            if (!user.progress.lessons) {
                user.progress.lessons = [];
            }

            let lessonIndex = user.progress.lessons.findIndex(l => l.lessonId === lessonId);
            let lessonProgress;

            if (lessonIndex === -1) {
                lessonProgress = {
                    lessonId,
                    subjectId,
                    isFavorite: false,
                    lastAccessed: new Date(),
                    totalTimeSpent: 0,
                    completedResources: [],
                    totalResourcesCount: await ProgressController.getLessonTotalResources(lessonId),
                };
                user.progress.lessons.push(lessonProgress);
                lessonIndex = user.progress.lessons.length - 1;
            } else {
                lessonProgress = user.progress.lessons[lessonIndex];
            }

            const wasCompleted = lessonProgress.completedResources.includes(resourceId);

            if (isCompleted && !wasCompleted) {
                lessonProgress.completedResources.push(resourceId);

                if (resourceType === 'pdf') {
                    user.progress.documentsOpened = (user.progress.documentsOpened || 0) + 1;
                } else if (resourceType === 'video') {
                    user.progress.videosWatched = (user.progress.videosWatched || 0) + 1;
                }
            } else if (!isCompleted && wasCompleted) {
                lessonProgress.completedResources = lessonProgress.completedResources.filter(id => id !== resourceId);
            }

            lessonProgress.lastAccessed = new Date();

            let totalUsageSeconds = 0;
            user.progress.lessons.forEach(lp => {
                totalUsageSeconds += lp.totalTimeSpent || 0;
            });
            user.progress.usageTime = Math.round(totalUsageSeconds / 60);
            user.progress.learningTime = user.progress.usageTime;

            user.markModified('progress');
            await user.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Mark resource complete error:', error);
            res.status(500).json({ error: 'Failed to mark resource complete' });
        }
    }

    // Toggle lesson favorite
    static async toggleLessonFavorite(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId, subjectId } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            if (!user.progress) {
                user.progress = { totalLessons: 0, completedLessons: 0, learningTime: 0, documentsOpened: 0, videosWatched: 0, usageTime: 0, savedNews: [], lessons: [] };
            }
            if (!user.progress.lessons) {
                user.progress.lessons = [];
            }

            let lessonIndex = user.progress.lessons.findIndex(l => l.lessonId === lessonId);
            let lessonProgress;

            if (lessonIndex === -1) {
                lessonProgress = {
                    lessonId,
                    subjectId,
                    isFavorite: false,
                    lastAccessed: new Date(),
                    totalTimeSpent: 0,
                    completedResources: [],
                    totalResourcesCount: await ProgressController.getLessonTotalResources(lessonId),
                };
                user.progress.lessons.push(lessonProgress);
                lessonIndex = user.progress.lessons.length - 1;
            } else {
                lessonProgress = user.progress.lessons[lessonIndex];
            }

            lessonProgress.isFavorite = !lessonProgress.isFavorite;

            user.markModified('progress');
            await user.save();

            res.json({ isFavorite: lessonProgress.isFavorite });
        } catch (error) {
            console.error('Toggle lesson favorite error:', error);
            res.status(500).json({ error: 'Failed to toggle favorite' });
        }
    }

    // Get favorite lessons
    static async getFavoriteLessons(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = await User.findById(req.userId);
            if (!user || !user.progress || !user.progress.lessons) {
                res.json([]);
                return;
            }

            const favorites = user.progress.lessons
                .filter(lesson => lesson.isFavorite)
                .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());

            const lessonIds = favorites.map(f => f.lessonId);
            const subjectIds = favorites.map(f => f.subjectId);

            const lessonsInfo = await Lesson.find({ _id: { $in: lessonIds } }, '_id title').lean();
            const subjectsInfo = await Subject.find({ _id: { $in: subjectIds } }, '_id title').lean();

            const lessonMap = new Map(lessonsInfo.map(l => [l._id, l.title]));
            const subjectMap = new Map(subjectsInfo.map(s => [s._id, s.title]));

            const enrichedFavorites = favorites.map(f => ({
                lessonId: f.lessonId,
                subjectId: f.subjectId,
                isFavorite: f.isFavorite,
                lastAccessed: f.lastAccessed,
                totalTimeSpent: f.totalTimeSpent,
                completedResources: f.completedResources,
                totalResourcesCount: f.totalResourcesCount,
                lessonTitle: lessonMap.get(f.lessonId) || 'Unknown Lesson',
                subjectTitle: subjectMap.get(f.subjectId) || 'Unknown Subject'
            }));

            res.json(enrichedFavorites);
        } catch (error) {
            console.error('Get favorite lessons error:', error);
            res.status(500).json({ error: 'Failed to get favorite lessons' });
        }
    }

    // Get subject progress
    static async getSubjectProgress(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { subjectId } = req.params;

            const user = await User.findById(req.userId);
            if (!user || !user.progress || !user.progress.lessons) {
                res.json({ completedResources: 0, totalResources: 0, progressPercentage: 0 });
                return;
            }

            let completedResources = 0;
            let totalResources = 0;

            user.progress.lessons.forEach(lesson => {
                if (lesson.subjectId === subjectId) {
                    completedResources += lesson.completedResources.length;
                    totalResources += lesson.totalResourcesCount;
                }
            });

            const progressPercentage = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;

            res.json({ completedResources, totalResources, progressPercentage });
        } catch (error) {
            console.error('Get subject progress error:', error);
            res.status(500).json({ error: 'Failed to get subject progress' });
        }
    }

    // Update lesson resource count
    static async updateLessonResourceCount(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId, subjectId, totalCount } = req.body;

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            if (!user.progress) {
                user.progress = { totalLessons: 0, completedLessons: 0, learningTime: 0, documentsOpened: 0, videosWatched: 0, usageTime: 0, savedNews: [], lessons: [] };
            }
            if (!user.progress.lessons) {
                user.progress.lessons = [];
            }

            let lessonIndex = user.progress.lessons.findIndex(l => l.lessonId === lessonId);
            let lessonProgress;

            if (lessonIndex === -1) {
                lessonProgress = {
                    lessonId,
                    subjectId,
                    isFavorite: false,
                    lastAccessed: new Date(),
                    totalTimeSpent: 0,
                    completedResources: [],
                    totalResourcesCount: totalCount || await ProgressController.getLessonTotalResources(lessonId),
                };
                user.progress.lessons.push(lessonProgress);
            } else {
                user.progress.lessons[lessonIndex].totalResourcesCount = totalCount;
            }

            user.markModified('progress');
            await user.save();

            res.json({ success: true, totalResourcesCount: totalCount });
        } catch (error) {
            console.error('Update lesson resource count error:', error);
            res.status(500).json({ error: 'Failed to update lesson resource count' });
        }
    }

    // Get specific lesson progress
    static async getLessonProgressById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId } = req.params;

            const user = await User.findById(req.userId);
            if (!user || !user.progress || !user.progress.lessons) {
                res.json(null);
                return;
            }

            const progress = user.progress.lessons.find(l => l.lessonId === lessonId);
            res.json(progress || null);
        } catch (error) {
            console.error('Get lesson progress by ID error:', error);
            res.status(500).json({ error: 'Failed to get lesson progress' });
        }
    }
}
