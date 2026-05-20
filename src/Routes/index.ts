import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './user';
import { locationRouter } from './location';
import { userJWT } from '../helper';

const router = Router();

router.use('/auth', authRouter);
router.use('/location', locationRouter);

router.use(userJWT)
router.use('/user', userRouter);

export { router };