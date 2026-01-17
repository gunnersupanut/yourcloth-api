import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getAddressesController, addAddressController } from '../controllers/addressController';

const router = express.Router();

router.get('/', authMiddleware, getAddressesController);
router.post('/', authMiddleware, addAddressController);

export default router;