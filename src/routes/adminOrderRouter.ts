import express from 'express'
import { approvePaymentController, getAdminOrderDetailController, getAdminOrdersController, getInspectingOrdersController, rejectPaymentController, shippingOrderController } from '../controllers/adminOrderController';
import { authAdminMiddleware } from '../middleware/authMiddleware';

const router = express.Router()
router.get("/", authAdminMiddleware, getAdminOrdersController);
router.get("/:id", authAdminMiddleware, getAdminOrderDetailController)
router.get('/inspecting', authAdminMiddleware, getInspectingOrdersController);
router.post('/:orderId/approve', authAdminMiddleware, approvePaymentController);
router.post('/:orderId/reject', authAdminMiddleware, rejectPaymentController);
router.post('/:orderId/shipping', authAdminMiddleware, shippingOrderController)
export default router