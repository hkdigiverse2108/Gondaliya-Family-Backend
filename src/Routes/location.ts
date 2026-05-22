import { Router } from 'express';
import { locationController } from '../controllers';
import { validateRequest, createLocation, updateLocation, getLocations, deleteLocation, validateParams, validateQuery } from '../validation';

const router = Router();

router.post('/add', validateRequest(createLocation), locationController.createLocation);
router.put('/update', validateRequest(updateLocation), locationController.updateLocation);
router.delete('/:id', validateParams(deleteLocation), locationController.deleteLocation);
router.get('/all', validateQuery(getLocations), locationController.getLocations);

export const locationRouter = router;
