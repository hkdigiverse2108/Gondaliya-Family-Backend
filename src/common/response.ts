import { Response } from 'express';
import { HTTP_STATUS } from './httpStatus';

export const responseSuccess = (res: Response, message: string, data: any = {}) => {
    return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message,
        data,
        error: {}
    });
};

export const responseError = (res: Response, status: number, message: string, error: any = {}) => {
    return res.status(status).json({
        status,
        message,
        data: {},
        error
    });
};

export const internalServerError = (res: Response, error: any) => {
    console.error('Internal Server Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        data: {},
        error: process.env.NODE_ENV === 'development' ? error : {}
    });
};
