import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { TeacherApplication } from '../models/TeacherApplication';
import { TeacherProfile } from '../models/TeacherProfile';
import { TeacherRoom } from '../models/TeacherRoom';
import { TeacherVerification } from '../models/TeacherVerification';
import fs from 'fs';

export class TeacherController {
    // ─── APPLICATION SYSTEM ───

    static applyValidation = [
        body('fullName').notEmpty().trim().isLength({ max: 100 }),
        body('email').isEmail().normalizeEmail(),
        body('age').isInt({ min: 16, max: 80 }),
        body('studyBranch').notEmpty().trim(),
        body('studyLevel').notEmpty().trim(),
        body('specialist').notEmpty().trim(),
        body('currentStand').notEmpty().trim(),
        body('targetLevelId').notEmpty().trim(),
        body('targetGuidanceId').notEmpty().trim(),
        body('targetSubjectId').notEmpty().trim(),
    ];

    /** Submit a teacher application with demo video */
    static async submitApplication(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            if (!req.file) {
                res.status(400).json({ error: 'Demo video is required' });
                return;
            }

            // Check for existing pending application
            const existing = await TeacherApplication.findOne({
                userId: req.userId,
                status: 'pending',
            });
            if (existing) {
                // Delete uploaded file since we're rejecting
                fs.unlink(req.file.path, () => {});
                res.status(400).json({ error: 'You already have a pending application' });
                return;
            }

            const application = await TeacherApplication.create({
                userId: req.userId,
                fullName: req.body.fullName,
                email: req.body.email,
                age: req.body.age,
                studyBranch: req.body.studyBranch,
                studyLevel: req.body.studyLevel,
                specialist: req.body.specialist,
                currentStand: req.body.currentStand,
                targetLevelId: req.body.targetLevelId,
                targetGuidanceId: req.body.targetGuidanceId,
                targetSubjectId: req.body.targetSubjectId,
                videoUrl: req.file.filename,
            });

            res.status(201).json({ message: 'Application submitted successfully', applicationId: application._id });
        } catch (error) {
            console.error('Submit application error:', error);
            res.status(500).json({ error: 'Failed to submit application' });
        }
    }

    /** Get current user's applications */
    static async getMyApplications(req: AuthRequest, res: Response): Promise<void> {
        try {
            const applications = await TeacherApplication.find({ userId: req.userId })
                .sort({ createdAt: -1 })
                .lean();
            res.json(applications);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch applications' });
        }
    }

    /** Admin: list all applications with optional status filter */
    static async listApplications(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { status } = req.query;
            const filter: any = {};
            if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
                filter.status = status;
            }

            const applications = await TeacherApplication.find(filter)
                .populate('userId', 'displayName email photoURL')
                .sort({ createdAt: -1 })
                .lean();

            res.json(applications);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch applications' });
        }
    }

    /** Admin: review (approve/reject) an application */
    static async reviewApplication(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status, reviewNote } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                res.status(400).json({ error: 'Status must be approved or rejected' });
                return;
            }

            const application = await TeacherApplication.findById(id);
            if (!application) {
                res.status(404).json({ error: 'Application not found' });
                return;
            }

            application.status = status;
            application.reviewNote = reviewNote;
            application.reviewedBy = req.userId as any;
            application.reviewedAt = new Date();
            await application.save();

            // If approved, upgrade user role to instructor and create teacher profile
            if (status === 'approved') {
                await User.findByIdAndUpdate(application.userId, { role: 'instructor' });

                const user = await User.findById(application.userId);
                // Create teacher profile if it doesn't exist
                const existingProfile = await TeacherProfile.findOne({ userId: application.userId });
                if (!existingProfile) {
                    await TeacherProfile.create({
                        userId: application.userId,
                        fullName: application.fullName,
                        specialist: application.specialist,
                        schoolName: '',
                        guidanceId: application.targetGuidanceId,
                        subjectId: application.targetSubjectId,
                        photoURL: user?.photoURL,
                        isVerified: true,
                    });
                }
            }

            res.json({ message: `Application ${status}`, application });
        } catch (error) {
            res.status(500).json({ error: 'Failed to review application' });
        }
    }

    // ─── TEACHER PROFILE SYSTEM ───

    /** Create or update teacher profile (for real-life school teachers) */
    static profileValidation = [
        body('fullName').notEmpty().trim().isLength({ max: 100 }),
        body('specialist').notEmpty().trim(),
        body('schoolName').notEmpty().trim(),
        body('guidanceId').notEmpty().trim(),
        body('subjectId').notEmpty().trim(),
    ];

    static async createOrUpdateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const user = await User.findById(req.userId);
            if (!user || (user.role !== 'instructor' && user.role !== 'teacher' && user.role !== 'admin')) {
                res.status(403).json({ error: 'Teacher access required' });
                return;
            }

            const profileData = {
                userId: req.userId,
                fullName: req.body.fullName,
                bio: req.body.bio,
                specialist: req.body.specialist,
                schoolName: req.body.schoolName,
                guidanceId: req.body.guidanceId,
                subjectId: req.body.subjectId,
                photoURL: user.photoURL,
            };

            const profile = await TeacherProfile.findOneAndUpdate(
                { userId: req.userId },
                { $set: profileData },
                { upsert: true, new: true, runValidators: true }
            );

            res.json(profile);
        } catch (error) {
            res.status(500).json({ error: 'Failed to save teacher profile' });
        }
    }

    /** Get teacher profile by ID (public) */
    static async getProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const profile = await TeacherProfile.findById(id)
                .populate('userId', 'displayName email photoURL')
                .populate('ratings.userId', 'displayName photoURL')
                .lean();

            if (!profile) {
                res.status(404).json({ error: 'Teacher profile not found' });
                return;
            }

            res.json(profile);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    /** Get my teacher profile */
    static async getMyProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const profile = await TeacherProfile.findOne({ userId: req.userId })
                .populate('ratings.userId', 'displayName photoURL')
                .lean();

            if (!profile) {
                res.status(404).json({ error: 'No teacher profile found' });
                return;
            }

            res.json(profile);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    /** List all active teacher profiles (public browse) */
    static async listProfiles(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { guidanceId, subjectId } = req.query;
            const filter: any = { isActive: true };
            if (guidanceId) filter.guidanceId = guidanceId;
            if (subjectId) filter.subjectId = subjectId;

            const profiles = await TeacherProfile.find(filter)
                .populate('userId', 'displayName photoURL')
                .sort({ averageRating: -1 })
                .lean();

            res.json(profiles);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch profiles' });
        }
    }

    /** Rate a teacher */
    static async rateTeacher(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                res.status(400).json({ error: 'Rating must be between 1 and 5' });
                return;
            }

            const profile = await TeacherProfile.findById(id);
            if (!profile) {
                res.status(404).json({ error: 'Teacher profile not found' });
                return;
            }

            // Check if user is rating themselves
            if (profile.userId.toString() === req.userId) {
                res.status(400).json({ error: 'You cannot rate yourself' });
                return;
            }

            // Remove existing rating from this user if any
            profile.ratings = profile.ratings.filter(
                r => r.userId.toString() !== req.userId
            );

            // Add new rating
            profile.ratings.push({
                userId: req.userId as any,
                rating,
                comment,
                createdAt: new Date(),
            });

            // Recalculate average
            const total = profile.ratings.reduce((sum, r) => sum + r.rating, 0);
            profile.averageRating = Math.round((total / profile.ratings.length) * 10) / 10;
            profile.totalRatings = profile.ratings.length;

            await profile.save();
            res.json({ message: 'Rating submitted', averageRating: profile.averageRating, totalRatings: profile.totalRatings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to rate teacher' });
        }
    }

    // ─── TEACHER ROOMS ───

    static roomValidation = [
        body('name').notEmpty().trim().isLength({ max: 100 }),
        body('guidanceId').notEmpty().trim(),
        body('subjectId').notEmpty().trim(),
    ];

    /** Create a teacher room */
    static async createRoom(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const user = await User.findById(req.userId);
            if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
                res.status(403).json({ error: 'Teacher access required' });
                return;
            }

            const teacherProfile = await TeacherProfile.findOne({ userId: req.userId });
            if (!teacherProfile) {
                res.status(400).json({ error: 'Create a teacher profile first' });
                return;
            }

            const room = await TeacherRoom.create({
                teacherId: req.userId,
                teacherProfileId: teacherProfile._id,
                name: req.body.name,
                description: req.body.description,
                guidanceId: req.body.guidanceId,
                subjectId: req.body.subjectId,
                members: [req.userId],
            });

            res.status(201).json({ room, inviteCode: room.inviteCode });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create room' });
        }
    }

    /** Join a teacher room via invite code */
    static async joinRoom(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { inviteCode } = req.params;
            const room = await TeacherRoom.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });

            if (!room) {
                res.status(404).json({ error: 'Room not found or inactive' });
                return;
            }

            if (room.members.length >= room.maxMembers) {
                res.status(400).json({ error: 'Room is full' });
                return;
            }

            const userId = req.userId as any;
            if (!room.members.includes(userId)) {
                room.members.push(userId);
                await room.save();

                // Increment teacher's student count
                await TeacherProfile.findByIdAndUpdate(room.teacherProfileId, { $inc: { totalStudents: 1 } });
            }

            res.json({ message: 'Joined room successfully', room });
        } catch (error) {
            res.status(500).json({ error: 'Failed to join room' });
        }
    }

    /** Get rooms created by the teacher */
    static async getMyRooms(req: AuthRequest, res: Response): Promise<void> {
        try {
            const rooms = await TeacherRoom.find({ teacherId: req.userId, isActive: true })
                .populate('members', 'displayName photoURL')
                .sort({ createdAt: -1 })
                .lean();
            res.json(rooms);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch rooms' });
        }
    }

    /** Get rooms the user is a member of */
    static async getJoinedRooms(req: AuthRequest, res: Response): Promise<void> {
        try {
            const rooms = await TeacherRoom.find({ members: req.userId, isActive: true })
                .populate('teacherId', 'displayName photoURL')
                .populate('teacherProfileId', 'fullName specialist averageRating')
                .sort({ lastMessageAt: -1 })
                .lean();
            res.json(rooms);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch joined rooms' });
        }
    }

    /** Get a specific room */
    static async getRoom(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const room = await TeacherRoom.findById(id)
                .populate('teacherId', 'displayName photoURL')
                .populate('teacherProfileId', 'fullName specialist averageRating')
                .populate('members', 'displayName photoURL')
                .lean();

            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            res.json(room);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch room' });
        }
    }

    /** Delete/deactivate a room (teacher only) */
    static async deleteRoom(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const room = await TeacherRoom.findOne({ _id: id, teacherId: req.userId });

            if (!room) {
                res.status(404).json({ error: 'Room not found or not owned by you' });
                return;
            }

            room.isActive = false;
            await room.save();
            res.json({ message: 'Room deactivated' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete room' });
        }
    }

    // ─── TEACHER VERIFICATION ───

    /** Submit teacher identity verification (any authenticated user) */
    static async submitVerification(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                if (req.file) fs.unlink(req.file.path, () => {});
                res.status(404).json({ error: 'User not found' });
                return;
            }

            if (!req.file) {
                res.status(400).json({ error: 'Verification document is required' });
                return;
            }

            const { schoolName, city, classLevel, className, subject, contactInfo, position, documentType } = req.body;
            if (!schoolName || !city || !classLevel || !subject || !contactInfo || !position || !documentType) {
                fs.unlink(req.file.path, () => {});
                res.status(400).json({ error: 'schoolName, city, classLevel, position, and documentType are required' });
                return;
            }

            const allowed = ['id_card', 'certificate', 'school_letter', 'other'];
            if (!allowed.includes(documentType)) {
                fs.unlink(req.file.path, () => {});
                res.status(400).json({ error: 'Invalid documentType' });
                return;
            }

            // Check for existing submission
            const existing = await TeacherVerification.findOne({ userId: req.userId });
            if (existing) {
                if (existing.status === 'pending') {
                    fs.unlink(req.file.path, () => {});
                    res.status(409).json({ error: 'You already have a pending verification request' });
                    return;
                }
                if (existing.status === 'approved') {
                    fs.unlink(req.file.path, () => {});
                    res.status(409).json({ error: 'Already verified' });
                    return;
                }
                // Rejected — allow resubmission: delete old doc and update
                if (existing.documentUrl) fs.unlink(existing.documentUrl, () => {});
                const cwdNorm = process.cwd().replace(/\\/g, '/');
                const fullNorm = req.file.path.replace(/\\/g, '/');
                const dataIdx = fullNorm.indexOf('/data/');
                const relativePath = dataIdx >= 0 ? fullNorm.slice(dataIdx + 1) : fullNorm.replace(cwdNorm + '/', '');
                existing.schoolName = schoolName.trim();
                existing.city = city.trim();
                existing.classLevel = classLevel.trim();
                existing.className = className?.trim();
                existing.subject = subject.trim();
                existing.contactInfo = contactInfo.trim();
                existing.position = position.trim();
                existing.documentUrl = relativePath;
                existing.documentType = documentType;
                existing.status = 'pending';
                existing.reviewNote = undefined;
                await existing.save();
                res.json({ message: 'Verification resubmitted', verification: existing });
                return;
            }

            const cwdNorm = process.cwd().replace(/\\/g, '/');
            const fullNorm = req.file.path.replace(/\\/g, '/');
            const dataIdx = fullNorm.indexOf('/data/');
            const relativePath = dataIdx >= 0 ? fullNorm.slice(dataIdx + 1) : fullNorm.replace(cwdNorm + '/', '');

            const verification = await TeacherVerification.create({
                userId: req.userId,
                schoolName: schoolName.trim(),
                city: city.trim(),
                classLevel: classLevel.trim(),
                className: className?.trim(),
                position: position.trim(),
                subject: subject.trim(),
                contactInfo: contactInfo.trim(),
                documentUrl: relativePath,
                documentType,
            });

            res.status(201).json({ message: 'Verification submitted', verification });
        } catch (error) {
            if (req.file) fs.unlink(req.file.path, () => {});
            res.status(500).json({ error: 'Failed to submit verification' });
        }
    }

    /** Get current user's verification status */
    static async getMyVerification(req: AuthRequest, res: Response): Promise<void> {
        try {
            const verification = await TeacherVerification.findOne({ userId: req.userId }).lean();
            res.json(verification || null);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch verification' });
        }
    }

    /** Admin: list all teacher verifications with optional status filter */
    static async listVerifications(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { status } = req.query;
            const filter: any = {};
            if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
                filter.status = status;
            }

            const verifications = await TeacherVerification.find(filter)
                .populate('userId', 'displayName email photoURL')
                .sort({ createdAt: -1 })
                .lean();

            res.json(verifications);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch verifications' });
        }
    }

    /** Admin: approve/reject a teacher verification */
    static async reviewVerification(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status, reviewNote } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                res.status(400).json({ error: 'Status must be approved or rejected' });
                return;
            }

            const verification = await TeacherVerification.findById(id);
            if (!verification) {
                res.status(404).json({ error: 'Verification not found' });
                return;
            }

            verification.status = status;
            verification.reviewNote = reviewNote;
            verification.reviewedBy = req.userId as any;
            verification.reviewedAt = new Date();
            await verification.save();

            // If approved, upgrade user role to teacher and create teacher profile
            if (status === 'approved') {
                const user = await User.findById(verification.userId);
                // Only upgrade to teacher if not already an instructor
                if (user && user.role !== 'instructor') {
                    user.role = 'teacher';
                    await user.save();
                }

                // Create teacher profile if it doesn't exist
                try {
                    const existingProfile = await TeacherProfile.findOne({ userId: verification.userId });
                    if (!existingProfile) {
                        await TeacherProfile.create({
                            userId: verification.userId,
                            fullName: user?.displayName || '',
                            specialist: verification.subject,
                            schoolName: verification.schoolName,
                            guidanceId: 'unassigned',
                            subjectId: 'unassigned',
                            isVerified: true,
                        });
                    }
                } catch (profileErr) {
                    console.error('Teacher profile creation failed (non-critical):', profileErr);
                }
            }

            res.json({ message: `Verification ${status}`, verification });
        } catch (error) {
            console.error('Review verification error:', error);
            res.status(500).json({ error: 'Failed to review verification' });
        }
    }
}
