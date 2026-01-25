import express from 'express'
import { approvePaymentController, getInspectingOrdersController, rejectPaymentController, shippingOrderController } from '../controllers/adminOrderController';
import { authAdminMiddleware } from '../middleware/authMiddleware';

const router = express.Router()
router.get('/inspecting', authAdminMiddleware, getInspectingOrdersController);

router.patch('/:orderId/approve', authAdminMiddleware, approvePaymentController);
router.patch('/:orderId/reject', authAdminMiddleware, rejectPaymentController);
router.patch('/:orderId/shipping', authAdminMiddleware, shippingOrderController)
export default router