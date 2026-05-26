import Joi from 'joi';
import { isValidObjectId } from '../common';

export const sendChatMessage = Joi.object({
    message: Joi.string().optional().allow(null, ''),
    mediaUrl: Joi.string().optional().allow(null, ''),
    mediaType: Joi.string().valid('TEXT', 'IMAGE', 'VIDEO', 'FILE').optional(),
    fileSize: Joi.number().optional(),
    messageType: Joi.string().valid('text', 'give', 'take').optional()
});

export const deleteChatMessage = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});

export const blockChatMessage = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    chatId: Joi.string().custom(isValidObjectId).optional()
}).or('id', 'chatId');

export const getChatMessages = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    my: Joi.string().valid('true', 'false').optional()
});
