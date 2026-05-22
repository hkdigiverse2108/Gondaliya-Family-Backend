import { Router } from 'express';
import { supportController } from '../controllers';
import { updateSupport, validateRequest } from '../validation';

const router = Router();

router.get('/all', supportController.getSupportContact);
router.put('/update', validateRequest(updateSupport), supportController.updateSupportContact);

export const supportRouter = router;
