import express from "express";
import { getAllProductController, getCheckoutValidation, getProductController } from "../controllers/productController";
const router = express.Router();

// Get All Product
router.get('/', getAllProductController)

// Get Product 
router.get('/:id', getProductController)

router.post('/validate-checkout', getCheckoutValidation);
export default router