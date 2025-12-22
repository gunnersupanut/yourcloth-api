import express from 'express';
import { loginController, registerController, resentEmailController, verifyController } from '../controllers/authController';
const router = express.Router();

// ---Register
router.post('/register', registerController);

// ---Login
router.post('/login', loginController);

// ---verify email
router.get('/verify-email', verifyController)

router.post('/resent-email', resentEmailController)
export default router