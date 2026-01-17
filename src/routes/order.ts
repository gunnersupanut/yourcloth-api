import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createOrderController, getOrderByIdController } from '../controllers/orderController';

const router = express.Router();
// get
router.get('/:id', authMiddleware, getOrderByIdController);
// POST
router.post('/', authMiddleware, createOrderController);

export default router;