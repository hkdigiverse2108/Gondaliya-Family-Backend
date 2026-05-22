import Joi from 'joi';

export const getParivar = Joi.object({
    village: Joi.string().optional().allow(''),
    search: Joi.string().optional().allow('')
});
