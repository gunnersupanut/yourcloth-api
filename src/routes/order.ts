import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createOrderController, getAllOrdersController, getOrderByIdController, moveOrderToInspectingController } from '../controllers/orderController';

const router = express.Router();
// get
router.get('/', authMiddleware, getAllOrdersController)
// get id
router.get('/:id', authMiddleware, getOrderByIdController);
// POST
router.post('/', authMiddleware, createOrderController);
router.post('/:orderId/confirm-payment', authMiddleware, moveOrderToInspectingController);
export default router;