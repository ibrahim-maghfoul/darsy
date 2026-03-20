import { Router } from 'express';
import { TeacherController } from '../controllers/teacherController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { videoUpload, verificationUpload } from '../middleware/upload';

const router = Router();

// ─── APPLICATION SYSTEM ───
// Submit application (authenticated user + video upload)
router.post(
    '/apply',
    authMiddleware,
    videoUpload.single('video'),
    TeacherController.applyValidation,
    TeacherController.submitApplication
);

// Get my applications
router.get('/applications/me', authMiddleware, TeacherController.getMyApplications);

// Admin: list all applications
router.get('/applications', authMiddleware, adminMiddleware, TeacherController.listApplications);

// Admin: approve/reject application
router.patch('/applications/:id/review', authMiddleware, adminMiddleware, TeacherController.reviewApplication);

// ─── TEACHER VERIFICATION ───
router.post('/verify', authMiddleware, verificationUpload.single('document'), TeacherController.submitVerification);
router.get('/verify/me', authMiddleware, TeacherController.getMyVerification);

// Admin: list all verifications
router.get('/verifications', authMiddleware, adminMiddleware, TeacherController.listVerifications);

// Admin: approve/reject verification
router.patch('/verifications/:id/review', authMiddleware, adminMiddleware, TeacherController.reviewVerification);

// ─── TEACHER PROFILES ───
// Public: browse teacher profiles
router.get('/profiles', TeacherController.listProfiles);

// Public: get single teacher profile
router.get('/profiles/:id', TeacherController.getProfile);

// Teacher: get/create/update own profile
router.get('/profile/me', authMiddleware, TeacherController.getMyProfile);
router.put(
    '/profile',
    authMiddleware,
    TeacherController.profileValidation,
    TeacherController.createOrUpdateProfile
);

// Rate a teacher (authenticated)
router.post('/profiles/:id/rate', authMiddleware, TeacherController.rateTeacher);

// ─── TEACHER ROOMS ───
// Teacher: create room
router.post(
    '/rooms',
    authMiddleware,
    TeacherController.roomValidation,
    TeacherController.createRoom
);

// Teacher: get my rooms
router.get('/rooms/me', authMiddleware, TeacherController.getMyRooms);

// User: get rooms I joined
router.get('/rooms/joined', authMiddleware, TeacherController.getJoinedRooms);

// Join room via invite code
router.post('/rooms/join/:inviteCode', authMiddleware, TeacherController.joinRoom);

// Get specific room
router.get('/rooms/:id', authMiddleware, TeacherController.getRoom);

// Teacher: deactivate room
router.delete('/rooms/:id', authMiddleware, TeacherController.deleteRoom);

export default router;
