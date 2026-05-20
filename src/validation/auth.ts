import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, USER_ROLES, HOUSE_TYPES, MARITAL_STATUS, BLOOD_GROUPS, RELATIONS, responseError } from '../common';

export const signUpSchema = Joi.object({
    firstName: Joi.string().required(),
    middleName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().required(),
    phoneNumber: Joi.string().length(10).required(),
    profilePhoto: Joi.string().optional().allow(null, ''),
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
        const { error } = schema.validate(req.body);
        if (error) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
        }
        next();
    };
};
