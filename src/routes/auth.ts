import express from 'express';
import { checkResetPasswordTokenController, forgotPasswordController, loginController, registerController, resentEmailController, resetPasswordContoller, verifyController } from '../controllers/authController';
const router = express.Router();
import rateLimit from 'express-rate-limit';
// กัน spam email
const resendEmailLimiter = rateLimit({
    windowMs: 60 * 1000, // ภายใน 1 นาที (60,000 ms)
    max: 3, // ยิงได้ไม่เกิน 3 ครั้ง 
    message: {
        message: "You've resend too many times. Please wait 1 minute."
    },
    standardHeaders: true, // ส่ง Header บอกว่าเหลือโควตากี่ครั้ง
    legacyHeaders: false,
    // ปิดการเช็ค xForwardedForHeader ของตัว library เอง
    validate: {
        xForwardedForHeader: false,
    },
});

// ---Register
router.post('/register', registerController);

// ---Login
router.post('/login', loginController);

// ---verify email
router.get('/verify-email', verifyController)

router.post('/resent-email', resendEmailLimiter, resentEmailController)
router.post('/forgotpassword',resendEmailLimiter, forgotPasswordController)
router.get('/checkresetpasswordtoken', checkResetPasswordTokenController)
router.post('/resetpassword', resetPasswordContoller)

export default router