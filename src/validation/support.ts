import Joi from 'joi';

export const updateSupport = Joi.object({
    phones: Joi.array().items(Joi.string().required()).default([]).optional(),
    email: Joi.string().email().required(),
    address: Joi.string().optional().allow(null, '')
});
