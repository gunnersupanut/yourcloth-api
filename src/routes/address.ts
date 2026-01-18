import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getAddressesController, addAddressController, updateAddressController, deleteAddressController, setAddressDefault } from '../controllers/addressController';

const router = express.Router();

router.get('/', authMiddleware, getAddressesController);
router.post('/', authMiddleware, addAddressController);
router.put('/:id', authMiddleware, updateAddressController);
// DELETE 
router.delete('/:id', authMiddleware, deleteAddressController);

router.patch('/default/:id', authMiddleware, setAddressDefault)
export default router;