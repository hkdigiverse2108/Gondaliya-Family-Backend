import Joi from 'joi';
import { isValidObjectId, HOUSE_TYPES, MARITAL_STATUS, BLOOD_GROUPS, RELATIONS } from '../common';

export const createUser = Joi.object({
    firstName: Joi.string().required(),
    middleName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().length(10).required(),
    password: Joi.string().required(),
    profilePhoto: Joi.string().optional().allow(null, ''),
    isActive: Joi.boolean().optional(),
    village: Joi.string().optional().allow(null, ''),
    pincode: Joi.string().optional().allow(null, ''),
    taluka: Joi.string().optional().allow(null, ''),
    district: Joi.string().optional().allow(null, ''),
    currentAddress: Joi.string().optional().allow(null, ''),
    houseType: Joi.string().valid(...Object.values(HOUSE_TYPES)).optional().allow(null, ''),
    phoneNumber2: Joi.string().length(10).optional().allow(null, ''),
    familyMembers: Joi.array().items(
        Joi.object({
            fullName: Joi.string().optional().allow(null, ''),
            relation: Joi.string().valid(...Object.values(RELATIONS)).optional().allow(null, ''),
            dob: Joi.string().optional().allow(null, ''),
            education: Joi.string().optional().allow(null, ''),
            occupation: Joi.string().optional().allow(null, ''),
            isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
            bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
            skills: Joi.string().optional().allow(null, ''),
            phoneNumber: Joi.string().length(10).optional().allow(null, '')
        })
    ).optional()
});

export const updateUser = Joi.object({
    userId: Joi.string().custom(isValidObjectId).required(),
    firstName: Joi.string().optional(),
    middleName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().optional().allow(null, ''),
    phoneNumber: Joi.string().length(10).optional(),
    password: Joi.string().optional(),
    profilePhoto: Joi.string().optional().allow(null, ''),
    isActive: Joi.boolean().optional(),
    village: Joi.string().optional().allow(null, ''),
    pincode: Joi.string().optional().allow(null, ''),
    taluka: Joi.string().optional().allow(null, ''),
    district: Joi.string().optional().allow(null, ''),
    currentAddress: Joi.string().optional().allow(null, ''),
    houseType: Joi.string().valid(...Object.values(HOUSE_TYPES)).optional().allow(null, ''),
    phoneNumber2: Joi.string().length(10).optional().allow(null, ''),
    familyMembers: Joi.array().items(
        Joi.object({
            fullName: Joi.string().optional().allow(null, ''),
            relation: Joi.string().valid(...Object.values(RELATIONS)).optional().allow(null, ''),
            dob: Joi.string().optional().allow(null, ''),
            education: Joi.string().optional().allow(null, ''),
            occupation: Joi.string().optional().allow(null, ''),
            isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
            bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
            skills: Joi.string().optional().allow(null, ''),
            phoneNumber: Joi.string().length(10).optional().allow(null, '')
        })
    ).optional()
});

export const deleteUser = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});

export const getUsers = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().optional(),
    sortFilter: Joi.string().optional(),
    activeFilter: Joi.string().optional(),
    startDateFilter: Joi.string().optional(),
    endDateFilter: Joi.string().optional(),
});

export const getUserById = Joi.object({
    id: Joi.string().custom(isValidObjectId).required()
});
