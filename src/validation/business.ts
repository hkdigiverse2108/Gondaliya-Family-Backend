import Joi from 'joi';
import { isValidObjectId } from '../common';

export const getBusinesses = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    category: Joi.string().optional().allow(''),
    subCategory: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    search: Joi.string().optional().allow(''),
});

export const getBusinessById = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
});

export const getBusinessByIdQuery = Joi.object({
    familyMemberId: Joi.string().custom(isValidObjectId).optional(),
});
