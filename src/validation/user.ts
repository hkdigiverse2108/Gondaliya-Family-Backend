import Joi from 'joi';
import { isValidObjectId, HOUSE_TYPES, MARITAL_STATUS, BLOOD_GROUPS, RELATIONS } from '../common';

const workDetailsJoi = Joi.object({
    hasOwnBusiness: Joi.boolean().optional().allow(null),
    businessDetails: Joi.object({
        category: Joi.string().optional().allow(null, ''),
        subCategory: Joi.string().optional().allow(null, ''),
        businessName: Joi.string().optional().allow(null, ''),
        ownerName: Joi.string().optional().allow(null, ''),
        description: Joi.string().optional().allow(null, ''),
        businessLogo: Joi.string().optional().allow(null, ''),
        locations: Joi.array().items(Joi.object({
            shopAddress: Joi.string().optional().allow(null, ''),
            areaCity: Joi.string().optional().allow(null, ''),
            state: Joi.string().optional().allow(null, ''),
            pincode: Joi.string().optional().allow(null, ''),
            googleMapLink: Joi.string().optional().allow(null, ''),
        })).optional().allow(null),
        contactInfo: Joi.object({
            mobile1: Joi.string().optional().allow(null, ''),
            mobile2: Joi.string().optional().allow(null, ''),
            email: Joi.string().email().optional().allow(null, ''),
            website: Joi.string().optional().allow(null, ''),
            portfolioLink: Joi.string().optional().allow(null, ''),
        }).optional().allow(null),
    }).optional().allow(null),
    jobDetails: Joi.object({
        jobCategory: Joi.string().optional().allow(null, ''),
        jobRole: Joi.string().optional().allow(null, ''),
        companyName: Joi.string().optional().allow(null, ''),
        jobLocation: Joi.string().optional().allow(null, ''),
    }).optional().allow(null),
}).optional().allow(null);

const familyMemberJoi = Joi.object({
    firstName: Joi.string().optional().allow(null, ''),
    middleName: Joi.string().optional().allow(null, ''),
    lastName: Joi.string().optional().allow(null, ''),
    profilePhoto: Joi.string().optional().allow(null, ''),
    relation: Joi.string().valid(...Object.values(RELATIONS)).optional().allow(null, ''),
    dob: Joi.string().optional().allow(null, ''),
    education: Joi.string().optional().allow(null, ''),
    isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
    bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
    phoneNumber: Joi.string().length(10).optional().allow(null, ''),
    workDetails: workDetailsJoi,
});

export const createUser = Joi.object({
    firstName: Joi.string().required(),
    middleName: Joi.string().required(),
    lastName: Joi.string().required(),
    dob: Joi.string().optional().allow(null, ''),
    bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
    education: Joi.string().optional().allow(null, ''),
    isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
    profilePhoto: Joi.string().optional().allow(null, ''),
    phoneNumber: Joi.string().length(10).required(),
    phoneNumber2: Joi.string().length(10).optional().allow(null, ''),
    password: Joi.string().required(),
    isActive: Joi.boolean().optional(),
    nativeVillage:  Joi.string().optional().allow(null, ''),
    nativeTaluka:   Joi.string().optional().allow(null, ''),
    nativeDistrict: Joi.string().optional().allow(null, ''),
    village: Joi.string().optional().allow(null, ''),
    pincode: Joi.string().optional().allow(null, ''),
    taluka: Joi.string().optional().allow(null, ''),
    district: Joi.string().optional().allow(null, ''),
    currentAddress: Joi.string().optional().allow(null, ''),
    currentCity:    Joi.string().optional().allow(null, ''),
    currentState:   Joi.string().optional().allow(null, ''),
    houseType: Joi.string().valid(...Object.values(HOUSE_TYPES)).optional().allow(null, ''),
    familyMembers: Joi.array().items(familyMemberJoi).optional(),
    workDetails: workDetailsJoi,
    deviceToken: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
});

export const updateUser = Joi.object({
    userId: Joi.string().custom(isValidObjectId).required(),
    firstName: Joi.string().optional(),
    middleName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    dob: Joi.string().optional().allow(null, ''),
    bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
    education: Joi.string().optional().allow(null, ''),
    isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
    profilePhoto: Joi.string().optional().allow(null, ''),
    email: Joi.string().email().optional().allow(null, ''),
    phoneNumber: Joi.string().length(10).optional(),
    phoneNumber2: Joi.string().length(10).optional().allow(null, ''),
    password: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    nativeVillage:  Joi.string().optional().allow(null, ''),
    nativeTaluka:   Joi.string().optional().allow(null, ''),
    nativeDistrict: Joi.string().optional().allow(null, ''),
    village: Joi.string().optional().allow(null, ''),
    pincode: Joi.string().optional().allow(null, ''),
    taluka: Joi.string().optional().allow(null, ''),
    district: Joi.string().optional().allow(null, ''),
    currentAddress: Joi.string().optional().allow(null, ''),
    currentCity:    Joi.string().optional().allow(null, ''),
    currentState:   Joi.string().optional().allow(null, ''),
    houseType: Joi.string().valid(...Object.values(HOUSE_TYPES)).optional().allow(null, ''),
    familyMembers: Joi.array().items(familyMemberJoi).optional(),
    workDetails: workDetailsJoi,
    deviceToken: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
});

export const deleteUser = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
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
    id: Joi.string().custom(isValidObjectId).required(),
});

export const addFamilyMemberSchema = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
    firstName: Joi.string().optional().allow(null, ''),
    middleName: Joi.string().optional().allow(null, ''),
    lastName: Joi.string().optional().allow(null, ''),
    profilePhoto: Joi.string().optional().allow(null, ''),
    relation: Joi.string().valid(...Object.values(RELATIONS)).optional().allow(null, ''),
    dob: Joi.string().optional().allow(null, ''),
    education: Joi.string().optional().allow(null, ''),
    isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
    bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
    phoneNumber: Joi.string().length(10).optional().allow(null, ''),
    workDetails: workDetailsJoi,
});

export const updateFamilyMemberSchema = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
    memberId: Joi.string().custom(isValidObjectId).required(),
    firstName: Joi.string().optional().allow(null, ''),
    middleName: Joi.string().optional().allow(null, ''),
    lastName: Joi.string().optional().allow(null, ''),
    profilePhoto: Joi.string().optional().allow(null, ''),
    relation: Joi.string().valid(...Object.values(RELATIONS)).optional().allow(null, ''),
    dob: Joi.string().optional().allow(null, ''),
    education: Joi.string().optional().allow(null, ''),
    isMarried: Joi.string().valid(...Object.values(MARITAL_STATUS)).optional().allow(null, ''),
    bloodGroup: Joi.string().valid(...Object.values(BLOOD_GROUPS)).optional().allow(null, ''),
    phoneNumber: Joi.string().length(10).optional().allow(null, ''),
    workDetails: workDetailsJoi,
});

export const deleteFamilyMemberSchema = Joi.object({
    id: Joi.string().custom(isValidObjectId).required(),
    memberId: Joi.string().custom(isValidObjectId).required(),
});
