import { Router } from 'express';
import { notificationController } from '../controllers';
import { createNotification, validateRequest } from '../validation';

const router = Router();

router.post('/add', validateRequest(createNotification), notificationController.createNotification);
router.get('/all', notificationController.getNotifications);
router.patch('/read-all', notificationController.readAllNotifications);

export const notificationRouter = router;
