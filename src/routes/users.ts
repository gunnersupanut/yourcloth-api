import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getMyProfileController, updateProfileController } from '../controllers/userController';
const router = express.Router();

// Get my profile
router.get('/me', authMiddleware, getMyProfileController)

// Updateprofile
router.patch('/me', authMiddleware, updateProfileController);

export default router