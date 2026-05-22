import { Router } from 'express';
import { feedbackController } from '../controllers';
import { createFeedback, updateFeedbackStatus, getFeedbackById, getFeedbacks, validateRequest, validateParams, validateQuery } from '../validation';

const router = Router();

router.post('/add', validateRequest(createFeedback), feedbackController.createFeedback);
router.get('/all', validateQuery(getFeedbacks), feedbackController.getFeedbacks);
router.patch('/status', validateRequest(updateFeedbackStatus), feedbackController.updateFeedbackStatus);
router.get('/:id', validateParams(getFeedbackById), feedbackController.getFeedbackById);

export const feedbackRouter = router;
