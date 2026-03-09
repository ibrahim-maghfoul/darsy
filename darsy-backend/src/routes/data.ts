import { Router } from 'express';
import { DataController } from '../controllers/dataController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { resourceUpload, verifyUploadedFile } from '../middleware/upload';

const router = Router();

// --- Public read endpoints ---
router.get('/schools', DataController.getSchools);
router.get('/levels/:schoolId', DataController.getLevels);
router.get('/guidances/:levelId', DataController.getGuidances);
router.get('/subjects/:guidanceId', DataController.getSubjects);
router.get('/lessons/:subjectId', DataController.getLessons);
router.get('/lesson/:lessonId', DataController.getLessonById);
router.get('/school-services', DataController.getSchoolServices);
router.get('/guidance-stats/global', DataController.getGlobalStats);
router.get('/guidance-stats/:guidanceId', DataController.getGuidanceStats);

// --- Protected: user resource contribution ---
router.post('/contribute', authMiddleware, resourceUpload.single('file'), verifyUploadedFile, DataController.contribute);

// --- Admin-only: write/update/delete endpoints ---
router.post('/schools', authMiddleware, adminMiddleware, DataController.createSchool);
router.post('/levels', authMiddleware, adminMiddleware, DataController.createLevel);
router.post('/guidances', authMiddleware, adminMiddleware, DataController.createGuidance);
router.post('/subjects', authMiddleware, adminMiddleware, DataController.createSubject);
router.post('/lessons', authMiddleware, adminMiddleware, DataController.createLesson);
router.post('/school-services', authMiddleware, adminMiddleware, DataController.createSchoolService);

router.put('/schools/:id', authMiddleware, adminMiddleware, DataController.updateSchool);
router.put('/levels/:id', authMiddleware, adminMiddleware, DataController.updateLevel);
router.put('/guidances/:id', authMiddleware, adminMiddleware, DataController.updateGuidance);
router.put('/subjects/:id', authMiddleware, adminMiddleware, DataController.updateSubject);
router.put('/lessons/:id', authMiddleware, adminMiddleware, DataController.updateLesson);

router.delete('/schools/:id', authMiddleware, adminMiddleware, DataController.deleteSchool);
router.delete('/levels/:id', authMiddleware, adminMiddleware, DataController.deleteLevel);
router.delete('/guidances/:id', authMiddleware, adminMiddleware, DataController.deleteGuidance);
router.delete('/subjects/:id', authMiddleware, adminMiddleware, DataController.deleteSubject);
router.delete('/lessons/:id', authMiddleware, adminMiddleware, DataController.deleteLesson);

// Guidance Stats (admin-only for write, public for read)
router.post('/guidance-stats', authMiddleware, adminMiddleware, DataController.upsertGuidanceStats);
router.post('/stats/recalculate', authMiddleware, adminMiddleware, DataController.recalculateAllStats);

export default router;
