import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, HOUSE_TYPES, MARITAL_STATUS, BLOOD_GROUPS, RELATIONS, responseError } from '../common';

export const signUpSchema = Joi.object({
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
    nativeVillage: Joi.string().optional().allow(null, ''),
    nativeTaluka: Joi.string().optional().allow(null, ''),
    nativeDistrict: Joi.string().optional().allow(null, ''),
    village: Joi.string().optional().allow(null, ''),
    pincode: Joi.string().optional().allow(null, ''),
    taluka: Joi.string().optional().allow(null, ''),
    district: Joi.string().optional().allow(null, ''),
    currentAddress: Joi.string().optional().allow(null, ''),
    currentCity: Joi.string().optional().allow(null, ''),
    currentState: Joi.string().optional().allow(null, ''),
    houseType: Joi.string().valid(...Object.values(HOUSE_TYPES)).optional().allow(null, ''),
    familyMembers: Joi.array().items(
        Joi.object({
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
            workDetails: Joi.object().optional().allow(null),
        })
    ).optional(),
    workDetails: Joi.object({
        hasOwnBusiness: Joi.boolean().optional().allow(null),
        businessDetails: Joi.object({
            category: Joi.string().optional().allow(null, ''),
            subCategory: Joi.string().optional().allow(null, ''),
            businessName: Joi.string().optional().allow(null, ''),
            ownerName: Joi.string().optional().allow(null, ''),
            description: Joi.string().optional().allow(null, ''),
            locations: Joi.array().items(
                Joi.object({
                    shopAddress: Joi.string().optional().allow(null, ''),
                    areaCity: Joi.string().optional().allow(null, ''),
                    state: Joi.string().optional().allow(null, ''),
                    pincode: Joi.string().optional().allow(null, ''),
                    googleMapLink: Joi.string().optional().allow(null, '')
                })
            ).optional().allow(null),
            contactInfo: Joi.object({
                mobile1: Joi.string().optional().allow(null, ''),
                mobile2: Joi.string().optional().allow(null, ''),
                email: Joi.string().email().optional().allow(null, ''),
                website: Joi.string().optional().allow(null, ''),
                portfolioLink: Joi.string().optional().allow(null, '')
            }).optional().allow(null)
        }).optional().allow(null),
        jobDetails: Joi.object({
            jobCategory: Joi.string().optional().allow(null, ''),
            jobRole: Joi.string().optional().allow(null, ''),
            companyName: Joi.string().optional().allow(null, ''),
            jobLocation: Joi.string().optional().allow(null, '')
        }).optional().allow(null)
    }).optional().allow(null)
});

export const loginSchema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    password: Joi.string().required(),
});

export const otpVerificationSchema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    otp: Joi.number().required(),
});

export const forgotPasswordSchema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
});

export const resetPasswordSchema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    password: Joi.string().min(6).required(),
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: false });
        if (error) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
        }
        next();
    };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params, { abortEarly: true });
        if (error) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
        }
        next();
    };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.query, { abortEarly: true, allowUnknown: false });
        if (error) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
        }
        next();
    };
};
