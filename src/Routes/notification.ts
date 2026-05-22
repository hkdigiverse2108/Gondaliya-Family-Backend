import { Router } from 'express';
import { notificationController } from '../controllers';

const router = Router();

router.get('/all', notificationController.getNotifications);
router.patch('/read-all', notificationController.readAllNotifications);

export const notificationRouter = router;
