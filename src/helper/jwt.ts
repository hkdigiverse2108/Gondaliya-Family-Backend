import jwt from 'jsonwebtoken'
import { userModel } from '../database'
import { responseError, HTTP_STATUS, isValidObjectId } from '../common'
import { Request, Response } from 'express'
import { responseMessage, getFirstMatch } from './index'

const jwt_token_secret = process.env.JWT_TOKEN_SECRET || 'your_secret_key';

export class AuthTokenError extends Error {
    code: 'tokenNotFound' | 'invalidToken' | 'accountBlock' | 'differentToken' | 'tokenExpire';

    constructor(code: AuthTokenError['code'], message?: string) {
        super(message || code);
        this.code = code;
    }
}

export const verifyUserFromToken = async (authorization: string) => {
    if (!authorization) {
        throw new AuthTokenError('tokenNotFound', responseMessage.tokenNotFound);
    }

    try {
        const token = authorization.startsWith('Bearer ')
            ? authorization.split(' ')[1]
            : authorization;

        const isVerifyToken: any = jwt.verify(token, jwt_token_secret);
        const result = await getFirstMatch(
            userModel,
            { _id: isValidObjectId(isVerifyToken._id), isDeleted: false },
            {},
            {}
        );

        if (!result) {
            throw new AuthTokenError('invalidToken', responseMessage.invalidToken);
        }

        if (!result.isActive) {
            throw new AuthTokenError('accountBlock', responseMessage.accountBlock);
        }

        return result;
    } catch (err: any) {
        if (err instanceof AuthTokenError) {
            throw err;
        }
        if (err.name === 'TokenExpiredError') {
            throw new AuthTokenError('tokenExpire', responseMessage.tokenExpire);
        }
        if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
            if (err?.message === 'invalid signature') {
                throw new AuthTokenError('differentToken', responseMessage.differentToken);
            }
            throw new AuthTokenError('invalidToken', responseMessage.invalidToken);
        }
        // Bubble up other errors (like mongoose/database timeout errors)
        throw err;
    }
};

export const userJWT = async (req: Request, res: Response, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return responseError(res, HTTP_STATUS.UNAUTHORIZED, responseMessage?.tokenNotFound);
    }

    try {
        const result = await verifyUserFromToken(authorization as string);
        req.headers.user = result;
        return next();
    } catch (err: any) {
        if (err instanceof AuthTokenError) {
            if (err.code === 'accountBlock') {
                return responseError(res, HTTP_STATUS.FORBIDDEN, err.message);
            }
            if (err.code === 'differentToken') {
                return responseError(res, HTTP_STATUS.FORBIDDEN, err.message);
            }
            if (err.code === 'tokenExpire') {
                return responseError(res, HTTP_STATUS.TOKEN_EXPIRED, err.message);
            }
            return responseError(res, HTTP_STATUS.UNAUTHORIZED, err.message);
        }
        console.error('Database/Server Error during JWT verification:', err);
        return responseError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error');
    }
};
