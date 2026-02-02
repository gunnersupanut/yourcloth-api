import express from "express";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// ต้อง Login เท่านั้นถึงจะเข้าถึง Profile ได้

router.get("/profile", authMiddleware, userController.getMyProfile);

router.put("/profile", authMiddleware, userController.updateMyProfile);
router.put("/change-password", authMiddleware, userController.changePassword);
export default router;