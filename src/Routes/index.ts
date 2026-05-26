import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './user';
import { locationRouter } from './location';
import { announcementRouter } from './announcement';
import { parivarRouter } from './parivar';
import { businessRouter } from './business';
import { chatRouter } from './chat';
import { listingRouter } from './listing';
import { inquiryRouter } from './inquiry';
import { notificationRouter } from './notification';
import { feedbackRouter } from './feedback';
import { supportRouter } from './support';
import { accountRouter } from './account';
import { privateChatRouter } from './privateChat';
import { uploadRouter } from './upload';
import { userJWT } from '../helper';

const router = Router();

router.use('/auth', authRouter);
router.use('/location', locationRouter);
router.use('/account', accountRouter);
router.use('/upload', uploadRouter);

router.use(userJWT)
router.use('/user', userRouter);
router.use('/announcements', announcementRouter);
router.use('/parivar', parivarRouter);
router.use('/businesses', businessRouter);
router.use('/chat', chatRouter);
router.use('/listings', listingRouter);
router.use('/inquiries', inquiryRouter);
router.use('/notifications', notificationRouter);
router.use('/feedback', feedbackRouter);
router.use('/support', supportRouter);
router.use('/private-chat', privateChatRouter);

export { router };