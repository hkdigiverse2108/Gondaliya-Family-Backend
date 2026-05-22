import Joi from 'joi';

export const updateSupport = Joi.object({
    phone: Joi.string().required(),
    phone2: Joi.string().optional().allow(null, ''),
    email: Joi.string().email().required(),
    address: Joi.string().optional().allow(null, '')
});
