import { Router } from 'express';
import { businessController } from '../controllers';
import {
    getBusinesses,
    getBusinessById,
    getBusinessByIdQuery,
    createBusinessSchema,
    updateBusinessSchema,
    validateParams,
    validateQuery,
    validateRequest
} from '../validation';

const router = Router();

router.get('/all', validateQuery(getBusinesses), businessController.getBusinesses);
router.get('/my', businessController.getMyBusinesses);
router.get('/:id', validateParams(getBusinessById), validateQuery(getBusinessByIdQuery), businessController.getBusinessById);

router.post('/', validateRequest(createBusinessSchema), businessController.createBusiness);
router.put('/:id', validateParams(getBusinessById), validateRequest(updateBusinessSchema), businessController.updateBusiness);
router.delete('/:id', validateParams(getBusinessById), businessController.deleteBusiness);

export const businessRouter = router;
