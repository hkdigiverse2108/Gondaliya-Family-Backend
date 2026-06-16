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
    familyMemberId: Joi.string().custom(isValidObjectId).optional().allow(null, ''),
});

export const createBusinessSchema = Joi.object({
    familyMemberId: Joi.string().custom(isValidObjectId).optional().allow(null, ''),
    category: Joi.string().required(),
    subCategory: Joi.array().items(Joi.string()).optional().default([]),
    businessName: Joi.string().required(),
    ownerName: Joi.string().optional().allow(null, ''),
    description: Joi.string().optional().allow(null, ''),
    businessLogo: Joi.string().optional().allow(null, ''),
    businessBanner: Joi.string().optional().allow(null, ''),
    businessPhotos: Joi.array().items(Joi.string()).optional().default([]),
    locations: Joi.array().items(Joi.object({
        shopAddress: Joi.string().optional().allow(null, ''),
        areaCity: Joi.string().optional().allow(null, ''),
        state: Joi.string().optional().allow(null, ''),
        pincode: Joi.string().optional().allow(null, ''),
        googleMapLink: Joi.string().optional().allow(null, ''),
    })).optional().default([]),
    contactInfo: Joi.object({
        mobile1: Joi.string().optional().allow(null, ''),
        mobile2: Joi.string().optional().allow(null, ''),
        email: Joi.string().email().optional().allow(null, ''),
        website: Joi.string().optional().allow(null, ''),
        portfolioLink: Joi.string().optional().allow(null, ''),
    }).optional().default({}),
});

export const updateBusinessSchema = Joi.object({
    category: Joi.string().optional(),
    subCategory: Joi.array().items(Joi.string()).optional(),
    businessName: Joi.string().optional(),
    ownerName: Joi.string().optional().allow(null, ''),
    description: Joi.string().optional().allow(null, ''),
    businessLogo: Joi.string().optional().allow(null, ''),
    businessBanner: Joi.string().optional().allow(null, ''),
    businessPhotos: Joi.array().items(Joi.string()).optional(),
    locations: Joi.array().items(Joi.object({
        shopAddress: Joi.string().optional().allow(null, ''),
        areaCity: Joi.string().optional().allow(null, ''),
        state: Joi.string().optional().allow(null, ''),
        pincode: Joi.string().optional().allow(null, ''),
        googleMapLink: Joi.string().optional().allow(null, ''),
    })).optional(),
    contactInfo: Joi.object({
        mobile1: Joi.string().optional().allow(null, ''),
        mobile2: Joi.string().optional().allow(null, ''),
        email: Joi.string().email().optional().allow(null, ''),
        website: Joi.string().optional().allow(null, ''),
        portfolioLink: Joi.string().optional().allow(null, ''),
    }).optional(),
});
