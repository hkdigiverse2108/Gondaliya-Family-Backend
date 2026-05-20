import { Router } from 'express';
import { authController } from '../controllers';
import { validateRequest, signUpSchema, loginSchema, otpVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation';

const router = Router();

router.post('/signup', validateRequest(signUpSchema), authController.signUp);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/verify-otp', validateRequest(otpVerificationSchema), authController.otpVerification);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

export const authRouter = router;
