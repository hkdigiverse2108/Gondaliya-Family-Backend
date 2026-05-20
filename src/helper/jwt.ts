import jwt from 'jsonwebtoken'
import { userModel } from '../database'
import { responseError, HTTP_STATUS, isValidObjectId } from '../common'
import { Request, Response } from 'express'
import { responseMessage, getFirstMatch } from './index'

const jwt_token_secret = process.env.JWT_TOKEN_SECRET || 'your_secret_key';

export const userJWT = async (req: Request, res: Response, next) => {
    let { authorization, role } = req.headers;
    if (authorization) {
        try {
            const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;
            const isVerifyToken: any = jwt.verify(token, jwt_token_secret);

            const result = await getFirstMatch(userModel, { _id: isValidObjectId(isVerifyToken._id), isDeleted: false }, {}, {});

            if (!result) {
                return responseError(res, HTTP_STATUS.UNAUTHORIZED, responseMessage?.invalidToken);
            }

            if (!result.isActive) {
                return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage?.accountBlock);
            }

            req.headers.user = result;
            return next();
        } catch (err: any) {
            if (err.message === "invalid signature") {
                return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage?.differentToken);
            }
            console.error('JWT Error:', err);
            return responseError(res, HTTP_STATUS.UNAUTHORIZED, responseMessage.invalidToken);
        }
    } else {
        return responseError(res, HTTP_STATUS.UNAUTHORIZED, responseMessage?.tokenNotFound);
    }
}
