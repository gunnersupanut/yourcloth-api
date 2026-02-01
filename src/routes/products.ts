import express from "express";
import { createProductController, getAdminProductById, getAdminProductsContoller, getAllProductController, getCheckoutValidation, getProductController, updateProduct } from "../controllers/productController";
import { authAdminMiddleware } from "../middleware/authMiddleware";
const router = express.Router();

// getAdmin
router.get('/admin', authAdminMiddleware, getAdminProductsContoller)
router.get("/admin/:id", authAdminMiddleware, getAdminProductById);
// Get All Product
router.get('/', getAllProductController)

// Get Product 
router.get('/:id', getProductController)

router.post('/validate-checkout', getCheckoutValidation);
router.post('/admin/create', authAdminMiddleware, createProductController);
router.put("/admin/:id", authAdminMiddleware, updateProduct);
export default router