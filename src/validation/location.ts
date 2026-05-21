import Joi from 'joi';
import { isValidObjectId } from '../common';

export const createLocation = Joi.object({
    village: Joi.string().required(),
    taluka: Joi.string().required(),
    district: Joi.string().required(),
    pincode: Joi.string().optional(),
});

export const updateLocation = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
    village: Joi.string().optional(),
    taluka: Joi.string().optional(),
    district: Joi.string().optional(),
    pincode: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
});

export const getLocations = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().optional(),
});

export const deleteLocation = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
});