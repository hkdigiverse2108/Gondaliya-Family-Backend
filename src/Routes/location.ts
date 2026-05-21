import { Router } from 'express';
import { locationController } from '../controllers';
import { validateRequest, createLocation, updateLocation, getLocations, deleteLocation } from '../validation';

const router = Router();

router.post('/add', validateRequest(createLocation), locationController.createLocation);
router.put('/update', validateRequest(updateLocation), locationController.updateLocation);
router.delete('/:id', validateRequest(deleteLocation), locationController.deleteLocation);
router.get('/', validateRequest(getLocations), locationController.getLocations);

export const locationRouter = router;
