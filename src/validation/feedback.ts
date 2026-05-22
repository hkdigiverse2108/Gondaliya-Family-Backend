import Joi from 'joi';
import { isValidObjectId } from '../common';

export const createFeedback = Joi.object({
    type: Joi.string().valid('FEEDBACK', 'COMPLAINT').required(),
    message: Joi.string().required()
});

export const updateFeedbackStatus = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    feedbackId: Joi.string().custom(isValidObjectId).optional(),
    status: Joi.string().valid('PENDING', 'REVIEWED', 'RESOLVED').required(),
    adminNote: Joi.string().optional().allow(null, '')
}).or('id', 'feedbackId');

export const getFeedbackById = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});

export const getFeedbacks = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    type: Joi.string().valid('FEEDBACK', 'COMPLAINT').optional(),
    status: Joi.string().valid('PENDING', 'REVIEWED', 'RESOLVED').optional()
});
