import Joi from 'joi';

export const getNotifications = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional()
});
