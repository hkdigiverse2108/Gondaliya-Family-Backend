import { Router } from 'express';
import { businessController } from '../controllers';
import { getBusinesses, getBusinessById, getBusinessByIdQuery, validateParams, validateQuery } from '../validation';

const router = Router();

router.get('/all', validateQuery(getBusinesses), businessController.getBusinesses);
router.get('/:id', validateParams(getBusinessById), validateQuery(getBusinessByIdQuery), businessController.getBusinessById);

export const businessRouter = router;
