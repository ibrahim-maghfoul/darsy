import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/profile', authMiddleware, UserController.getProfile);
router.patch('/profile', authMiddleware, UserController.updateProfile);
router.post('/change-password', authMiddleware, UserController.changePassword);
router.post('/profile/photo', authMiddleware, upload.single('photo'), UserController.uploadProfilePicture);
router.delete('/profile', authMiddleware, UserController.deleteAccount);
router.post('/report', authMiddleware, UserController.createReport);
router.get('/saved-news', authMiddleware, UserController.getSavedNews);
router.post('/saved-news', authMiddleware, UserController.toggleSavedNews);
router.patch('/subscribe', authMiddleware, UserController.subscribe);

export default router;
