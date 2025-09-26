import { Router } from 'express';
import { adminLogin, adminLogout } from '../controllers/adminControllers';

const router = Router();
router.post('/login', adminLogin);
router.post('/logout', adminLogout);
export default router;
