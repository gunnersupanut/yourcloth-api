import express from 'express';
import { adminUserController } from '../controllers/adminUserController';
import { authAdminMiddleware } from '../middleware/authMiddleware';
// import middleware เช็คสิทธิ์ Admin ของนายมาด้วย
// import { authorizeAdmin } from '../middlewares/roleMiddleware'; (ถ้ามี)

const router = express.Router();

// บังคับ Login ก่อนเข้า (และควรเช็คว่าเป็น Admin ด้วยนะ)
router.use(authAdminMiddleware);

// ดูรายชื่อ (ค้นหาได้)
router.get('/', adminUserController.getUsers);

// ดูรายคน
router.get('/:id', adminUserController.getUserById);


// แบน / ปลดแบน (เปลี่ยนสถานะ)
router.patch('/:id/status', adminUserController.toggleStatus);

export default router;