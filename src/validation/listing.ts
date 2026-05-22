import Joi from 'joi';
import { isValidObjectId } from '../common';

export const createListing = Joi.object({
    type: Joi.string().valid('RENT', 'SEASONAL', 'SECONDHAND').required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    photos: Joi.array().items(Joi.string()).max(5).optional(),
    price: Joi.number().required(),
    priceUnit: Joi.string().valid('PER_DAY', 'PER_MONTH', 'FIXED').required(),
    availableFrom: Joi.string().required(), // Stored as ISO/string Date
    availableTo: Joi.string().optional().allow(null, ''),
    location: Joi.object({
        city: Joi.string().required(),
        pincode: Joi.string().required()
    }).required(),
    contactPhone: Joi.string().required()
});

export const updateListing = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    listingId: Joi.string().custom(isValidObjectId).optional(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    photos: Joi.array().items(Joi.string()).max(5).optional(),
    price: Joi.number().optional(),
    priceUnit: Joi.string().valid('PER_DAY', 'PER_MONTH', 'FIXED').optional(),
    availableFrom: Joi.string().optional(),
    availableTo: Joi.string().optional().allow(null, ''),
    location: Joi.object({
        city: Joi.string().optional(),
        pincode: Joi.string().optional()
    }).optional(),
    contactPhone: Joi.string().optional(),
    status: Joi.string().valid('ACTIVE', 'SOLD', 'CLOSED').optional()
}).or('id', 'listingId');

export const updateListingStatus = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    listingId: Joi.string().custom(isValidObjectId).optional(),
    status: Joi.string().valid('SOLD', 'CLOSED').required()
}).or('id', 'listingId');

export const getListingById = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});

export const getListings = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    type: Joi.string().valid('RENT', 'SEASONAL', 'SECONDHAND').optional(),
    city: Joi.string().optional(),
    search: Joi.string().optional(),
    my: Joi.string().valid('true', 'false').optional()
});
