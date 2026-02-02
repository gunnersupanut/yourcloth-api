import { Router } from "express";
import { bannerController } from "../controllers/bannerController";
import { authAdminMiddleware } from "../middleware/authMiddleware";

const router = Router();

// --- Public ---
router.get("/public", bannerController.getPublicBanners);

// --- Admin ---
router.get("/",authAdminMiddleware, bannerController.getAllBanners);
router.post("/", authAdminMiddleware, bannerController.createBanner);
router.put("/:id", authAdminMiddleware, bannerController.updateBanner);
router.delete("/:id", authAdminMiddleware, bannerController.deleteBanner);

export default router;