import { Router } from "express";
import { supportController } from "../controllers/supportController";
import { authMiddleware, authAdminMiddleware } from "../middleware/authMiddleware";

const router = Router();

// --- User ---
// ต้อง Login ก่อนถึงจะส่งได้
router.post("/", authMiddleware, supportController.submitTicket);

// --- Admin ---
router.get("/", authAdminMiddleware, supportController.getAllTickets);
router.put("/:id/resolve", authAdminMiddleware, supportController.resolveTicket);

export default router;