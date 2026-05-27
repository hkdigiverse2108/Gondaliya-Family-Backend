import Joi from 'joi';
import { isValidObjectId } from '../common';

export const startConversationSchema = Joi.object({
    receiverId: Joi.string().custom(isValidObjectId).required()
});

export const sendPrivateMessageSchema = Joi.object({
    conversationId: Joi.string().custom(isValidObjectId).required(),
    receiverId: Joi.string().custom(isValidObjectId).required(),
    message: Joi.string().optional().allow(null, ''),
    messageType: Joi.string().valid('text', 'give', 'take').optional(),
    relatedListingId: Joi.string().custom(isValidObjectId).optional().allow(null, ''),
    mediaUrl: Joi.string().optional().allow(null, ''),
    mediaType: Joi.string().valid('TEXT', 'IMAGE', 'VIDEO', 'FILE').optional(),
    fileSize: Joi.number().optional()
});

export const getPrivateMessagesQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional()
});

export const conversationIdParamSchema = Joi.object({
    conversationId: Joi.string().custom(isValidObjectId).required()
});
