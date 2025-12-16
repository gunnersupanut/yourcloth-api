import express from "express";
import { getAllProductController, getProductController } from "../controllers/productController";
const router = express.Router();

// Get All Product
router.get('/', getAllProductController)

// Get Product ?
router.get('/:id', getProductController)

export default router