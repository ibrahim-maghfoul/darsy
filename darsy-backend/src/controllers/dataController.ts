import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { School } from '../models/School';
import { Level } from '../models/Level';
import { Guidance } from '../models/Guidance';
import { Subject } from '../models/Subject';
import { Lesson } from '../models/Lesson';
import { Contribution } from '../models/Contribution';
import { Report } from '../models/Report';
import { SchoolService } from '../models/SchoolService';
import { User } from '../models/User';

export class DataController {
    // Get all schools
    static async getSchools(_req: AuthRequest, res: Response): Promise<void> {
        try {
            const schools = await School.find().sort({ title: 1 });
            res.json(schools);
        } catch (error) {
            console.error('Get schools error:', error);
            res.status(500).json({ error: 'Failed to get schools' });
        }
    }

    // Get levels by school
    static async getLevels(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { schoolId } = req.params;
            const levels = await Level.find({ schoolId }).sort({ title: 1 });
            res.json(levels);
        } catch (error) {
            console.error('Get levels error:', error);
            res.status(500).json({ error: 'Failed to get levels' });
        }
    }

    // Get guidances by level
    static async getGuidances(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { levelId } = req.params;
            const guidances = await Guidance.find({ levelId }).sort({ title: 1 });
            res.json(guidances);
        } catch (error) {
            console.error('Get guidances error:', error);
            res.status(500).json({ error: 'Failed to get guidances' });
        }
    }

    // Get subjects by guidance
    static async getSubjects(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { guidanceId } = req.params;
            const subjects = await Subject.find({ guidanceId }).sort({ title: 1 });
            res.json(subjects);
        } catch (error) {
            console.error('Get subjects error:', error);
            res.status(500).json({ error: 'Failed to get subjects' });
        }
    }

    // Get lessons by subject
    static async getLessons(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { subjectId } = req.params;
            const lessons = await Lesson.find({ subjectId }).sort({ title: 1 });
            res.json(lessons);
        } catch (error) {
            console.error('Get lessons error:', error);
            res.status(500).json({ error: 'Failed to get lessons' });
        }
    }

    // Get lesson by ID
    static async getLessonById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { lessonId } = req.params;
            const lesson = await Lesson.findById(lessonId);

            if (!lesson) {
                res.status(404).json({ error: 'Lesson not found' });
                return;
            }

            res.json(lesson);
        } catch (error) {
            console.error('Get lesson error:', error);
            res.status(500).json({ error: 'Failed to get lesson' });
        }
    }

    // Create School
    static async createSchool(req: AuthRequest, res: Response): Promise<void> {
        try {
            const school = await School.create(req.body);
            res.status(201).json(school);
        } catch (error) {
            console.error('Create school error:', error);
            res.status(500).json({ error: 'Failed to create school' });
        }
    }

    // Create Level
    static async createLevel(req: AuthRequest, res: Response): Promise<void> {
        try {
            const level = await Level.create(req.body);
            res.status(201).json(level);
        } catch (error) {
            console.error('Create level error:', error);
            res.status(500).json({ error: 'Failed to create level' });
        }
    }

    // Create Guidance
    static async createGuidance(req: AuthRequest, res: Response): Promise<void> {
        try {
            const guidance = await Guidance.create(req.body);
            res.status(201).json(guidance);
        } catch (error) {
            console.error('Create guidance error:', error);
            res.status(500).json({ error: 'Failed to create guidance' });
        }
    }

    // Create Subject
    static async createSubject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const subject = await Subject.create(req.body);
            res.status(201).json(subject);
        } catch (error) {
            console.error('Create subject error:', error);
            res.status(500).json({ error: 'Failed to create subject' });
        }
    }

    // Create Lesson
    static async createLesson(req: AuthRequest, res: Response): Promise<void> {
        try {
            const lesson = await Lesson.create(req.body);
            res.status(201).json(lesson);
        } catch (error) {
            console.error('Create lesson error:', error);
            res.status(500).json({ error: 'Failed to create lesson' });
        }
    }

    // Upsert Guidance Stats (Legacy/Admin)
    static async upsertGuidanceStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { guidanceId, ...stats } = req.body;

            let report = await Report.findOne({ type: 'dashboard_stats' });
            if (!report) {
                report = new Report({ type: 'dashboard_stats', levelsStat: [] });
            }

            const levelIndex = report.levelsStat.findIndex(l => l.guidanceId === guidanceId);
            if (levelIndex > -1) {
                report.levelsStat[levelIndex] = { ...report.levelsStat[levelIndex], ...stats };
            } else {
                report.levelsStat.push({ guidanceId, ...stats });
            }

            await report.save();
            res.json(report.levelsStat[levelIndex > -1 ? levelIndex : report.levelsStat.length - 1]);
        } catch (error) {
            console.error('Upsert guidance stats error:', error);
            res.status(500).json({ error: 'Failed to upsert guidance stats' });
        }
    }

    // Get Guidance Stats
    static async getGuidanceStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { guidanceId } = req.params;
            const report = await Report.findOne({ type: 'dashboard_stats' });

            if (!report) {
                res.status(404).json({ error: 'Stats report not found' });
                return;
            }

            const stats = report.levelsStat.find(l => l.guidanceId === guidanceId);

            if (!stats) {
                res.status(404).json({ error: 'Stats not found for this guidance' });
                return;
            }

            res.json(stats);
        } catch (error) {
            console.error('Get guidance stats error:', error);
            res.status(500).json({ error: 'Failed to get guidance stats' });
        }
    }

    // Recalculate all stats (Deprecated: Use analyze.js script)
    static async recalculateAllStats(_req: AuthRequest, res: Response): Promise<void> {
        res.status(410).json({ error: 'This method is deprecated. Please use the darsy-script/analyze.js utility.' });
    }

    // Get Global Stats
    static async getGlobalStats(_req: AuthRequest, res: Response): Promise<void> {
        try {
            const report = await Report.findOne({ type: 'dashboard_stats' });
            if (!report) {
                res.status(404).json({ error: 'Global stats not found' });
                return;
            }
            res.json(report);
        } catch (error) {
            console.error('Get global stats error:', error);
            res.status(500).json({ error: 'Failed to get global stats' });
        }
    }

    // Update Methods
    static async updateSchool(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const school = await School.findByIdAndUpdate(id, req.body, { new: true });
            if (!school) {
                res.status(404).json({ error: 'School not found' });
                return;
            }
            res.json(school);
        } catch (error) {
            console.error('Update school error:', error);
            res.status(500).json({ error: 'Failed to update school' });
        }
    }

    static async updateLevel(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const level = await Level.findByIdAndUpdate(id, req.body, { new: true });
            if (!level) {
                res.status(404).json({ error: 'Level not found' });
                return;
            }
            res.json(level);
        } catch (error) {
            console.error('Update level error:', error);
            res.status(500).json({ error: 'Failed to update level' });
        }
    }

    static async updateGuidance(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const guidance = await Guidance.findByIdAndUpdate(id, req.body, { new: true });
            if (!guidance) {
                res.status(404).json({ error: 'Guidance not found' });
                return;
            }
            res.json(guidance);
        } catch (error) {
            console.error('Update guidance error:', error);
            res.status(500).json({ error: 'Failed to update guidance' });
        }
    }

    static async updateSubject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const subject = await Subject.findByIdAndUpdate(id, req.body, { new: true });
            if (!subject) {
                res.status(404).json({ error: 'Subject not found' });
                return;
            }
            res.json(subject);
        } catch (error) {
            console.error('Update subject error:', error);
            res.status(500).json({ error: 'Failed to update subject' });
        }
    }

    static async updateLesson(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
            if (!lesson) {
                res.status(404).json({ error: 'Lesson not found' });
                return;
            }
            res.json(lesson);
        } catch (error) {
            console.error('Update lesson error:', error);
            res.status(500).json({ error: 'Failed to update lesson' });
        }
    }

    // Delete Methods
    static async deleteSchool(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const school = await School.findByIdAndDelete(id);
            if (!school) {
                res.status(404).json({ error: 'School not found' });
                return;
            }
            res.json({ message: 'School deleted successfully' });
        } catch (error) {
            console.error('Delete school error:', error);
            res.status(500).json({ error: 'Failed to delete school' });
        }
    }

    static async deleteLevel(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const level = await Level.findByIdAndDelete(id);
            if (!level) {
                res.status(404).json({ error: 'Level not found' });
                return;
            }
            res.json({ message: 'Level deleted successfully' });
        } catch (error) {
            console.error('Delete level error:', error);
            res.status(500).json({ error: 'Failed to delete level' });
        }
    }

    static async deleteGuidance(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const guidance = await Guidance.findByIdAndDelete(id);
            if (!guidance) {
                res.status(404).json({ error: 'Guidance not found' });
                return;
            }
            res.json({ message: 'Guidance deleted successfully' });
        } catch (error) {
            console.error('Delete guidance error:', error);
            res.status(500).json({ error: 'Failed to delete guidance' });
        }
    }

    static async deleteSubject(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const subject = await Subject.findByIdAndDelete(id);
            if (!subject) {
                res.status(404).json({ error: 'Subject not found' });
                return;
            }
            res.json({ message: 'Subject deleted successfully' });
        } catch (error) {
            console.error('Delete subject error:', error);
            res.status(500).json({ error: 'Failed to delete subject' });
        }
    }

    static async deleteLesson(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const lesson = await Lesson.findByIdAndDelete(id);
            if (!lesson) {
                res.status(404).json({ error: 'Lesson not found' });
                return;
            }
            res.json({ message: 'Lesson deleted successfully' });
        } catch (error) {
            console.error('Delete lesson error:', error);
            res.status(500).json({ error: 'Failed to delete lesson' });
        }
    }

    // Contribute Resource
    static async contribute(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { subjectId, lessonId, newLessonTitle, resourceTitle } = req.body;
            const file = req.file;

            if (!file || !subjectId || !resourceTitle) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            let targetLesson;

            if (newLessonTitle) {
                // Create a new lesson
                const lessonCount = await Lesson.countDocuments();
                const newId = `lesson-${lessonCount + 1}-${Date.now()}`;
                targetLesson = new Lesson({
                    _id: newId,
                    title: newLessonTitle,
                    subjectId: subjectId,
                    coursesPdf: []
                });
                await targetLesson.save();
            } else if (lessonId && lessonId !== 'contribution') {
                targetLesson = await Lesson.findById(lessonId);
            }

            // Generate URL (Legacy: /data/resources/filename, New: filename)
            const url = file.filename;

            // Add resource to coursesPdf if a target lesson was found
            if (targetLesson) {
                if (!targetLesson.coursesPdf) targetLesson.coursesPdf = [];
                targetLesson.coursesPdf.push({
                    title: resourceTitle,
                    url: url,
                    type: file.mimetype.startsWith('image/') ? 'Image' : 'PDF'
                });
                await targetLesson.save();
            }

            // Create a new Contribution record
            const contribution = new Contribution({
                userId: req.userId,
                resourceTitle,
                url: url,
                subjectId,
                lessonId: targetLesson ? targetLesson._id : 'general',
                status: 'pending' // Default status
            });
            await contribution.save();

            res.status(201).json({
                message: 'Resource contributed successfully',
                lesson: targetLesson
            });
        } catch (error) {
            console.error('Contribute resource error:', error);
            res.status(500).json({ error: 'Failed to contribute resource' });
        }
    }

    // Get Contributions Summary for CircleRing
    static async getContributionsSummary(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { guidanceId } = req.query as { guidanceId?: string };

            // If guidanceId provided, restrict to subjects in that guidance
            let matchStage: Record<string, unknown> = {};
            if (guidanceId) {
                const guidanceSubjects = await Subject.find({ guidanceId }, '_id');
                const subjectIds = guidanceSubjects.map(s => s._id.toString());
                matchStage = { subjectId: { $in: subjectIds } };
            }

            const summaryData = await Contribution.aggregate([
                ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const userIds = summaryData.map(d => d._id);
            const users = await User.find({ _id: { $in: userIds } }, 'displayName photoURL subscription');
            
            const result = summaryData.map(d => {
                const user = users.find(u => u._id.toString() === d._id.toString());
                return {
                    userId: d._id,
                    contributions: d.count,
                    displayName: user?.displayName || 'Unknown Member',
                    photoURL: user?.photoURL || null,
                    isPremium: user?.isPremium || false
                };
            }).filter(u => u.displayName !== 'Unknown Member');

            // Pad with other users (top by points) to populate the CircleRing
            if (result.length < 60) {
                const padLimit = 60 - result.length;
                const otherUsers = await User.find({ _id: { $nin: userIds } }, 'displayName photoURL isPremium points')
                    .sort({ points: -1 })
                    .limit(padLimit);

                for (const u of otherUsers) {
                    if (u.displayName) {
                        result.push({
                            userId: u._id,
                            contributions: 0,
                            displayName: u.displayName,
                            photoURL: u.photoURL || null,
                            isPremium: u.isPremium || false
                        });
                    }
                }
            }

            res.json(result);
        } catch (error) {
            console.error('Get contributions summary error:', error);
            res.status(500).json({ error: 'Failed to get contributions summary' });
        }
    }

    // Get Recent Contributions for Feed
    static async getRecentContributions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { guidanceId } = req.query as { guidanceId?: string };

            // Filter to subjects in the user's guidance path if provided
            let filter: Record<string, unknown> = {};
            if (guidanceId) {
                const guidanceSubjects = await Subject.find({ guidanceId }, '_id');
                const subjectIds = guidanceSubjects.map(s => s._id.toString());
                filter = { subjectId: { $in: subjectIds } };
            }

            const recent = await Contribution.find(filter)
                .sort({ createdAt: -1 })
                .limit(20);

            const userIds = [...new Set(recent.map(c => c.userId))];
            const users = await User.find({ _id: { $in: userIds } }, 'displayName photoURL subscription');

            const subjectIds = [...new Set(recent.map(c => c.subjectId).filter(id => id))];
            const lessonIds = [...new Set(recent.map(c => c.lessonId).filter(id => id && id !== 'contribution'))];
            
            const subjects = await Subject.find({ _id: { $in: subjectIds } }, 'title');
            const lessons = await Lesson.find({ _id: { $in: lessonIds } }, 'title');

            const result = recent.map(c => {
                const user = users.find(u => u._id.toString() === c.userId.toString());
                const subject = subjects.find(s => s._id.toString() === c.subjectId?.toString());
                const lesson = lessons.find(l => l._id.toString() === c.lessonId?.toString());
                
                return {
                    ...c.toObject(),
                    subjectTitle: subject?.title || 'General',
                    lessonTitle: lesson?.title || 'General',
                    user: {
                        displayName: user?.displayName || 'Unknown Member',
                        photoURL: user?.photoURL || null,
                        isPremium: user?.isPremium || false
                    }
                };
            });

            res.json(result);
        } catch (error) {
            console.error('Get recent contributions error:', error);
            res.status(500).json({ error: 'Failed to get recent contributions' });
        }
    }

    // Get all school services
    static async getSchoolServices(_req: AuthRequest, res: Response): Promise<void> {
        try {
            const services = await SchoolService.find({ isActive: true }).sort({ order: 1 });
            res.json(services);
        } catch (error) {
            console.error('Get school services error:', error);
            res.status(500).json({ error: 'Failed to get school services' });
        }
    }

    // Create a school service (primarily for script/admin)
    static async createSchoolService(req: AuthRequest, res: Response): Promise<void> {
        try {
            const service = await SchoolService.create(req.body);
            res.status(201).json(service);
        } catch (error) {
            console.error('Create school service error:', error);
            res.status(500).json({ error: 'Failed to create school service' });
        }
    }

    // Update a school service
    static async updateSchoolService(req: AuthRequest, res: Response): Promise<void> {
        try {
            const service = await SchoolService.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!service) { res.status(404).json({ error: 'Service not found' }); return; }
            res.json(service);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update service' });
        }
    }

    // Delete a school service
    static async deleteSchoolService(req: AuthRequest, res: Response): Promise<void> {
        try {
            await SchoolService.findByIdAndDelete(req.params.id);
            res.json({ message: 'Service deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete service' });
        }
    }

    // Admin: Get all contributions
    static async getAllContributions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const limit = parseInt((req.query as any).limit) || 200;
            const contributions = await Contribution.find({}).sort({ createdAt: -1 }).limit(limit).lean();
            const userIds = [...new Set(contributions.map(c => c.userId))];
            const subjectIds = [...new Set(contributions.map(c => c.subjectId).filter(Boolean))];
            const lessonIds = [...new Set(contributions.map(c => c.lessonId).filter(id => id && id !== 'general'))];
            const [users, subjects, lessons] = await Promise.all([
                User.find({ _id: { $in: userIds } }, 'displayName email photoURL').lean(),
                Subject.find({ _id: { $in: subjectIds } }, 'title').lean(),
                Lesson.find({ _id: { $in: lessonIds } }, 'title').lean(),
            ]);
            const result = contributions.map(c => ({
                ...c,
                user: users.find(u => u._id.toString() === c.userId.toString()) || null,
                subjectTitle: subjects.find(s => s._id.toString() === c.subjectId?.toString())?.title || '—',
                lessonTitle: lessons.find(l => l._id.toString() === c.lessonId?.toString())?.title || '—',
            }));
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get contributions' });
        }
    }

    // Admin: Update contribution status
    static async updateContributionStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { status } = req.body;
            if (!['pending', 'approved', 'rejected'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
            const c = await Contribution.findByIdAndUpdate(req.params.id, { status }, { new: true });
            if (!c) { res.status(404).json({ error: 'Not found' }); return; }
            res.json(c);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update status' });
        }
    }

    // Admin: Delete contribution
    static async deleteContribution(req: AuthRequest, res: Response): Promise<void> {
        try {
            await Contribution.findByIdAndDelete(req.params.id);
            res.json({ message: 'Contribution deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete contribution' });
        }
    }
}
