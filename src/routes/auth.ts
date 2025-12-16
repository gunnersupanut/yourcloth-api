import express from 'express';
import { loginController, registerController } from '../controllers/authController';
const router = express.Router();

// ---Register
router.post('/register',registerController);

// ---Login
router.post('/login',loginController);
export default router