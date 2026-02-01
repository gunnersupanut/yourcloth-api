import express from "express";
import { createProductController, getAdminProductsContoller, getAllProductController, getCheckoutValidation, getProductController } from "../controllers/productController";
import { authAdminMiddleware } from "../middleware/authMiddleware";
const router = express.Router();

// getAdmin
router.get('/admin', authAdminMiddleware, getAdminProductsContoller)
// Get All Product
router.get('/', getAllProductController)

// Get Product 
router.get('/:id', getProductController)

router.post('/validate-checkout', getCheckoutValidation);
router.post('/admin/create', authAdminMiddleware, createProductController);
export default router