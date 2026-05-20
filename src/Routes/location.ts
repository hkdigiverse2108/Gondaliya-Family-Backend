import { Router } from 'express';
import { locationController } from '../controllers';
import { validateRequest, createLocation, updateLocation, getLocations, deleteLocation, getTalukas, getVillages } from '../validation';

const router = Router();

router.post('/add', validateRequest(createLocation), locationController.createLocation);
router.put('/update', validateRequest(updateLocation), locationController.updateLocation);
router.delete('/:id', validateRequest(deleteLocation), locationController.deleteLocation);
router.get('/', validateRequest(getLocations), locationController.getLocations);

// Hierarchical dynamic dropdown lookups
router.get('/districts', locationController.getDistricts);
router.get('/talukas', validateRequest(getTalukas), locationController.getTalukas);
router.get('/villages', validateRequest(getVillages), locationController.getVillages);

export const locationRouter = router;
