import { Router } from 'express';
import { adminController } from '../controllers';

const router = Router();

// Dashboard Statistics Endpoint
router.get('/dashboard', adminController.getDashboardStats);

export const adminRouter = router;
