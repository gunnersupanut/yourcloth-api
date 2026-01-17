import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { addCartController, deleteCartController, deleteSelectedCartsController, getCartController, updateCartController } from "../controllers/cartController";
const router = express.Router();

// Add To Cart
router.post('/', authMiddleware, addCartController)

// Get Cart All My Item
router.get('/', authMiddleware, getCartController)

// Update Quantity
router.patch('/:cartId', authMiddleware, updateCartController)

// Delete
router.delete('/bulk', authMiddleware, deleteSelectedCartsController)

router.delete('/:cartId', authMiddleware, deleteCartController)

export default router