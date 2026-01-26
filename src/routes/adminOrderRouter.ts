import express from 'express'
import { approvePaymentController, getAdminOrders, getInspectingOrdersController, rejectPaymentController, shippingOrderController } from '../controllers/adminOrderController';
import { authAdminMiddleware } from '../middleware/authMiddleware';

const router = express.Router()
router.get("/admin", authAdminMiddleware,getAdminOrders);
router.get('/inspecting', authAdminMiddleware, getInspectingOrdersController);
router.post('/:orderId/approve', authAdminMiddleware, approvePaymentController);
router.post('/:orderId/reject', authAdminMiddleware, rejectPaymentController);
router.post('/:orderId/shipping', authAdminMiddleware, shippingOrderController)
export default router