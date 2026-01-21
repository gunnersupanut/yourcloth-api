import express from 'express'
import { getInspectingOrdersController } from '../controllers/adminOrderController';
import { authAdminMiddleware } from '../middleware/authMiddleware';

const router = express.Router()
router.get('/inspecting', authAdminMiddleware, getInspectingOrdersController);
export default router