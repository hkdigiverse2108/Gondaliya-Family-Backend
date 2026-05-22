import { Router } from 'express';
import { announcementController } from '../controllers';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncements, validateRequest, validateParams, validateQuery } from '../validation';

const router = Router();

router.post('/add', validateRequest(createAnnouncement), announcementController.createAnnouncement);
router.get('/all', validateQuery(getAnnouncements), announcementController.getAnnouncements);
router.put('/update', validateRequest(updateAnnouncement), announcementController.updateAnnouncement);
router.delete('/:id', validateParams(deleteAnnouncement), announcementController.deleteAnnouncement);

export const announcementRouter = router;
