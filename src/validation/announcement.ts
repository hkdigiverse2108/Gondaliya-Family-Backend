import Joi from 'joi';
import { isValidObjectId } from '../common';

export const createAnnouncement = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    imageUrl: Joi.string().optional().allow(null, '')
});

export const updateAnnouncement = Joi.object({
    id: Joi.string().custom(isValidObjectId).optional(),
    announcementId: Joi.string().custom(isValidObjectId).optional(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    imageUrl: Joi.string().optional().allow(null, ''),
    isActive: Joi.boolean().optional()
}).or('id', 'announcementId');

export const deleteAnnouncement = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});

export const getAnnouncements = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().optional()
});
