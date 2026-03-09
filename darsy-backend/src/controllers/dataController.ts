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
}
