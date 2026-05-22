import { Router } from 'express';
import { parivarController } from '../controllers';
import { getParivar, validateQuery } from '../validation';

const router = Router();

router.get('/villages', parivarController.getVillages);
router.get('/all', validateQuery(getParivar), parivarController.getParivarDirectory);

export const parivarRouter = router;
