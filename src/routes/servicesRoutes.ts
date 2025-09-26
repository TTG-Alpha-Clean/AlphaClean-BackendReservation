import { Router } from 'express';
import { requireUser, requireAdmin } from '../middlewares/auth';
import {
  addService, listServices, getService, editService, removeService
} from '../controllers/servicesController';
import upload from '../middlewares/upload';

const router = Router();

// Public route (for customers to see available services)
router.get('/', listServices);

// Admin routes (require authentication)
router.get('/:id', requireUser, requireAdmin, getService);
router.post('/', requireUser, requireAdmin, upload.single("image"), addService);
router.put('/:id', requireUser, requireAdmin, upload.single("image"), editService);
router.delete('/:id', requireUser, requireAdmin, removeService);

export default router;