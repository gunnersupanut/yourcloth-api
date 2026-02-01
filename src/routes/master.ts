import express from "express";
import { masterController } from "../controllers/masterController";

const router = express.Router();
router.get("/metadata", masterController.getMetadata); // GET /api/master/metadata

export default router;