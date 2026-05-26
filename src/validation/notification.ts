import Joi from 'joi';
import { isValidObjectId, NOTIFICATION_TYPES } from '../common';

export const getNotifications = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional()
});

export const createNotification = Joi.object({
    userId: Joi.string().custom(isValidObjectId).optional(),
    userIds: Joi.array().items(Joi.string().custom(isValidObjectId)).min(1).optional(),
    broadcastToAll: Joi.boolean().valid(true).optional(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    type: Joi.string().valid(...Object.values(NOTIFICATION_TYPES)).required(),
    refId: Joi.string().custom(isValidObjectId).required(),
    sendPush: Joi.boolean().optional().default(true),
}).custom((value, helpers) => {
    if (value.broadcastToAll === true) return value;
    if (value.userId) return value;
    if (value.userIds?.length) return value;
    return helpers.error('any.custom', {
        message: 'Provide userId, userIds, or broadcastToAll: true',
    });
});
