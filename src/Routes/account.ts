import { Router } from 'express';
import { accountController } from '../controllers';

const router = Router();

// GET  /account/delete or /delete-account  → Render the account deletion page (EJS)
router.get('/delete', accountController.renderDeletePage);
router.get('/', accountController.renderDeletePage);

// POST /account/delete or /delete-account  → Process account deletion (API)
router.post('/delete', accountController.processDeleteAccount);
router.post('/', accountController.processDeleteAccount);

export const accountRouter = router;
