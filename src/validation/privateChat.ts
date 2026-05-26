import Joi from 'joi';
import { isValidObjectId } from '../common';

export const startConversationSchema = Joi.object({
    receiverId: Joi.string().custom(isValidObjectId).required()
});

export const sendPrivateMessageSchema = Joi.object({
    conversationId: Joi.string().custom(isValidObjectId).required(),
    receiverId: Joi.string().custom(isValidObjectId).required(),
    message: Joi.string().required(),
    messageType: Joi.string().valid('text', 'give', 'take').required(),
    relatedListingId: Joi.string().custom(isValidObjectId).optional().allow(null, '')
});

export const getPrivateMessagesQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional()
});

export const conversationIdParamSchema = Joi.object({
    conversationId: Joi.string().custom(isValidObjectId).required()
});
