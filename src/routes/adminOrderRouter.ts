import express from 'express'
import { approvePaymentController, getInspectingOrdersController, rejectPaymentController, shippingOrderController } from '../controllers/adminOrderController';
import { authAdminMiddleware } from '../middleware/authMiddleware';

const router = express.Router()
router.get('/inspecting', authAdminMiddleware, getInspectingOrdersController);

router.put('/:orderId/approve', authAdminMiddleware, approvePaymentController);
router.put('/:orderId/reject', authAdminMiddleware, rejectPaymentController);
router.put('/:orderId/shipping', authAdminMiddleware, shippingOrderController)
export default router