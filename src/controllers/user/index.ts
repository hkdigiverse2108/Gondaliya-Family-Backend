import { userModel } from '../../database';
import { generateHash, HTTP_STATUS, isValidObjectId, resolvePagination, resolveSortAndFilter, USER_ROLES, responseSuccess, responseError, internalServerError } from '../../common';
import { reqInfo, responseMessage, updateData, getFirstMatch, createData, getDataWithSorting, countData, redisGet, redisSet, redisDel, redisDelPattern } from '../../helper';

export const createUser = async (req, res) => {
    reqInfo(req);
    try {
        let body = req.body || {};

        // Gather all phone numbers to assert global uniqueness
        const incomingPhones: string[] = [];
        if (body.phoneNumber) incomingPhones.push(body.phoneNumber);
        if (body.phoneNumber2) incomingPhones.push(body.phoneNumber2);
        if (body.familyMembers && Array.isArray(body.familyMembers)) {
            for (const member of body.familyMembers) {
                if (member.phoneNumber) {
                    incomingPhones.push(member.phoneNumber);
                }
            }
        }

        const uniqueIncoming = new Set(incomingPhones);
        if (incomingPhones.length !== uniqueIncoming.size) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Duplicate phone numbers found in the request payload!");
        }

        for (const phone of incomingPhones) {
            const existing = await getFirstMatch(userModel, {
                isDeleted: false,
                $or: [
                    { phoneNumber: phone },
                    { phoneNumber2: phone },
                    { "familyMembers.phoneNumber": phone }
                ]
            }, {}, {});
            if (existing) {
                return responseError(res, HTTP_STATUS.CONFLICT, `Phone number ${phone} is already registered in the system!`);
            }
        }

        body.role = USER_ROLES.USER;
        body.password = await generateHash(body.password)

        const response = await createData(userModel, body);

        if (!response) return responseError(res, HTTP_STATUS.NOT_IMPLEMENTED, responseMessage.addDataError);

        await redisDelPattern(`users:list:*`);

        return responseSuccess(res, responseMessage.addDataSuccess("User"), response);
    } catch (error: any) {
        return internalServerError(res, error);
    }
};

export const updateUser = async (req, res) => {
    reqInfo(req);
    try {
        let body = req.body || {};

        const incomingPhones: string[] = [];
        if (body.phoneNumber) incomingPhones.push(body.phoneNumber);
        if (body.phoneNumber2) incomingPhones.push(body.phoneNumber2);
        if (body.familyMembers && Array.isArray(body.familyMembers)) {
            for (const member of body.familyMembers) {
                if (member.phoneNumber) {
                    incomingPhones.push(member.phoneNumber);
                }
            }
        }

        const uniqueIncoming = new Set(incomingPhones);
        if (incomingPhones.length !== uniqueIncoming.size) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Duplicate phone numbers found in the request payload!");
        }

        for (const phone of incomingPhones) {
            const existing = await getFirstMatch(userModel, {
                isDeleted: false,
                _id: { $ne: isValidObjectId(body.userId) },
                $or: [
                    { phoneNumber: phone },
                    { phoneNumber2: phone },
                    { "familyMembers.phoneNumber": phone }
                ]
            }, {}, {});
            if (existing) {
                return responseError(res, HTTP_STATUS.CONFLICT, `Phone number ${phone} is already registered in the system!`);
            }
        }

        const user = await updateData(userModel, { _id: isValidObjectId(body.userId), isDeleted: false }, body, {});
        if (!user) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${body.userId}`);

        return responseSuccess(res, responseMessage.updateDataSuccess("User"), user);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteUser = async (req, res) => {
    reqInfo(req);
    try {
        let { id } = req.params || {};

        const user = await updateData(userModel, { _id: isValidObjectId(id), isDeleted: false }, { isDeleted: true }, {});
        if (!user) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${id}`);

        return responseSuccess(res, responseMessage.deleteDataSuccess("User"));
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getUsers = async (req, res) => {
    reqInfo(req);
    let { user } = req.headers
    try {
        
        const cacheKey = `users:list:${JSON.stringify(req.query)}:${user?._id || 'guest'}`;
        const cachedData = await redisGet(cacheKey);
        
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Users"), JSON.parse(cachedData));
        }

        let { criteria, options, page, limit } = resolveSortAndFilter(req.query || {}, ['firstName', 'middleName', 'lastName', 'email', 'phoneNumber']);

        if (user?.role === USER_ROLES.USER) {
            criteria._id = isValidObjectId(user._id)
        } else {
            criteria.role = { $ne: USER_ROLES.ADMIN }
        }

        const response = await getDataWithSorting(userModel, criteria, {}, options);
        const totalCount = await countData(userModel, criteria);
        const stateObj = await resolvePagination(page, limit, totalCount);
        
        const result = {
            data: response,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Users"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};
