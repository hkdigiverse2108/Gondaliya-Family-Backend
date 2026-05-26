import Joi from 'joi';

export const uploadFileSchema = Joi.object({
    oldFileUrl: Joi.string().uri().optional().allow(null, '')
});
