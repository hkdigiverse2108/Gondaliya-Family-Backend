import { Router } from 'express';
import { inquiryController } from '../controllers';
import { createInquiry, replyInquiry, readInquiry, getInquiries, validateRequest, validateQuery } from '../validation';

const router = Router();

router.post('/add', validateRequest(createInquiry), inquiryController.createInquiry);
router.get('/received', validateQuery(getInquiries), inquiryController.getReceivedInquiries);
router.get('/sent', validateQuery(getInquiries), inquiryController.getSentInquiries);
router.post('/reply', validateRequest(replyInquiry), inquiryController.replyInquiry);
router.patch('/read', validateRequest(readInquiry), inquiryController.readInquiry);

export const inquiryRouter = router;
