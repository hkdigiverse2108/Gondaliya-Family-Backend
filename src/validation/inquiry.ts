import Joi from 'joi';
import { isValidObjectId } from '../common';

export const createInquiry = Joi.object({
    targetType: Joi.string().valid('BUSINESS', 'LISTING').required(),
    targetId: Joi.string().custom(isValidObjectId).required(),
    message: Joi.string().max(500).required()
});

export const replyInquiry = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    inquiryId: Joi.string().custom(isValidObjectId).optional(),
    reply: Joi.string().required()
}).or('id', 'inquiryId');

export const readInquiry = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    inquiryId: Joi.string().custom(isValidObjectId).optional(),
}).or('id', 'inquiryId');

export const getInquiryById = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});

export const getInquiries = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional()
});
