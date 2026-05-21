import { userModel } from '../../database';
import { generateHash, HTTP_STATUS, isValidObjectId, resolvePagination, resolveSortAndFilter, USER_ROLES, responseSuccess, responseError, internalServerError } from '../../common';
import { reqInfo, responseMessage, updateData, getFirstMatch, createData, getDataWithSorting, countData, redisGet, redisSet, redisDel, redisDelPattern, promoteIfHasPhone, resolveOnSelfRegister, linkSelfRegisteredMember, addPhoneToMember } from '../../helper';
import mongoose from 'mongoose';

export const createUser = async (req, res) => {
    reqInfo(req);
    try {
        let body = req.body || {};

        const incomingPhones: string[] = [];
        if (body.phoneNumber) incomingPhones.push(body.phoneNumber);
        if (body.phoneNumber2) incomingPhones.push(body.phoneNumber2);
        if (body.familyMembers && Array.isArray(body.familyMembers)) {
            for (const member of body.familyMembers) {
                if (member.phoneNumber) incomingPhones.push(member.phoneNumber);
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

        const selfRegisterLink = await resolveOnSelfRegister(body.phoneNumber);

        body.role = USER_ROLES.USER;
        body.password = await generateHash(body.password);
        body.isHeadOfFamily = !selfRegisterLink.alreadyLinked;

        const response = await createData(userModel, body);
        if (!response) return responseError(res, HTTP_STATUS.NOT_IMPLEMENTED, responseMessage.addDataError);

        if (response.familyMembers?.length) {
            await promoteIfHasPhone(response);
        }

        if (selfRegisterLink.alreadyLinked) {
            await linkSelfRegisteredMember(
                String(response._id),
                selfRegisterLink.headId!,
                selfRegisterLink.familyMemberRefId!
            );
        }

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
        const { userId, ...updateFields } = body;

        const incomingPhones: string[] = [];
        if (updateFields.phoneNumber) incomingPhones.push(updateFields.phoneNumber);
        if (updateFields.phoneNumber2) incomingPhones.push(updateFields.phoneNumber2);
        if (updateFields.familyMembers && Array.isArray(updateFields.familyMembers)) {
            for (const member of updateFields.familyMembers) {
                if (member.phoneNumber) incomingPhones.push(member.phoneNumber);
            }
        }

        const uniqueIncoming = new Set(incomingPhones);
        if (incomingPhones.length !== uniqueIncoming.size) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Duplicate phone numbers found in the request payload!");
        }

        for (const phone of incomingPhones) {
            const existing = await getFirstMatch(userModel, {
                isDeleted: false,
                _id: { $ne: isValidObjectId(userId) },
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

        // Hash password if being updated
        if (updateFields.password) {
            updateFields.password = await generateHash(updateFields.password);
        }

        const user = await updateData(userModel, { _id: isValidObjectId(userId), isDeleted: false }, updateFields, {});
        if (!user) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${userId}`);
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
    let { user } = req.headers;
    try {
        const cacheKey = `users:list:${JSON.stringify(req.query)}:${user?._id || 'guest'}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Users"), JSON.parse(cachedData));
        }

        let { criteria, options, page, limit } = resolveSortAndFilter(req.query || {}, ['firstName', 'middleName', 'lastName', 'email', 'phoneNumber']);

        if (user?.role === USER_ROLES.USER) {
            criteria._id = isValidObjectId(user._id);
        } else {
            criteria.role = { $ne: USER_ROLES.ADMIN };
        }

        const response = await getDataWithSorting(userModel, criteria, {}, options);
        const totalCount = await countData(userModel, criteria);
        const stateObj = await resolvePagination(page, limit, totalCount);

        const result = { data: response, totalData: totalCount, state: stateObj };
        await redisSet(cacheKey, JSON.stringify(result), 600);
        return responseSuccess(res, responseMessage.getDataSuccess("Users"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};


export const addFamilyMember = async (req, res) => {
    reqInfo(req);
    try {
        const headId = req.params.id;
        const memberData = req.body || {};

        const head = await getFirstMatch(userModel, { _id: isValidObjectId(headId), isDeleted: false }, {}, {});
        if (!head) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        if (memberData.phoneNumber) {
            const existing = await getFirstMatch(userModel, {
                isDeleted: false,
                $or: [
                    { phoneNumber: memberData.phoneNumber },
                    { phoneNumber2: memberData.phoneNumber },
                    { 'familyMembers.phoneNumber': memberData.phoneNumber },
                ]
            }, {}, {});
            if (existing) {
                return responseError(res, HTTP_STATUS.CONFLICT, `Phone number ${memberData.phoneNumber} is already registered in the system!`);
            }
        }

        memberData._id = new mongoose.Types.ObjectId();
        const updatedHead = await updateData(userModel, { _id: isValidObjectId(headId), isDeleted: false }, { $push: { familyMembers: memberData } }, {});

        if (memberData.phoneNumber) {
            await addPhoneToMember(String(head._id), String(memberData._id), memberData.phoneNumber);
        }

        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${headId}`);
        return responseSuccess(res, responseMessage.addDataSuccess("Family member"), updatedHead);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateFamilyMember = async (req, res) => {
    reqInfo(req);
    try {
        const { id: headId, memberId } = req.params;
        const updates = req.body || {};

        const head = await getFirstMatch(userModel, { _id: isValidObjectId(headId), isDeleted: false }, {}, {});
        if (!head) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        const member = head.familyMembers.find((m: any) => String(m._id) === memberId);
        if (!member) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Family member"));

        const isAddingPhone = updates.phoneNumber && !member.phoneNumber && !member.isIndependent;

        if (isAddingPhone) {
            const existing = await getFirstMatch(userModel, {
                isDeleted: false,
                $or: [
                    { phoneNumber: updates.phoneNumber },
                    { phoneNumber2: updates.phoneNumber },
                    { 'familyMembers.phoneNumber': updates.phoneNumber },
                ]
            }, {}, {});
            if (existing) {
                return responseError(res, HTTP_STATUS.CONFLICT, `Phone number ${updates.phoneNumber} is already registered in the system!`);
            }
        }

        const setPayload: any = {};
        for (const key in updates) {
            setPayload[`familyMembers.$.${key}`] = updates[key];
        }

        const updatedHead = await updateData(
            userModel,
            { _id: isValidObjectId(headId), 'familyMembers._id': isValidObjectId(memberId), isDeleted: false },
            { $set: setPayload },
            {}
        );

        if (isAddingPhone) {
            await addPhoneToMember(headId, memberId, updates.phoneNumber);
        }

        if (member.isIndependent && member.linkedUserId) {
            const syncFields: any = {};
            const personalFields = ['firstName', 'middleName', 'lastName', 'profilePhoto', 'dob', 'education', 'isMarried', 'bloodGroup'];
            for (const f of personalFields) {
                if (updates[f] !== undefined) syncFields[f] = updates[f];
            }
            if (Object.keys(syncFields).length) {
                await updateData(userModel, { _id: isValidObjectId(member.linkedUserId) }, syncFields, {});
            }
        }

        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${headId}`);
        return responseSuccess(res, responseMessage.updateDataSuccess("Family member"), updatedHead);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteFamilyMember = async (req, res) => {
    reqInfo(req);
    try {
        const { id: headId, memberId } = req.params;

        const head = await getFirstMatch(userModel, { _id: isValidObjectId(headId), isDeleted: false }, {}, {});
        if (!head) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        const member = head.familyMembers.find((m: any) => String(m._id) === memberId);
        if (!member) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Family member"));

        if (member.isIndependent && member.linkedUserId) {
            await updateData(userModel, { _id: isValidObjectId(member.linkedUserId) }, {
                isHeadOfFamily: true,
                linkedFamily: { headUserId: null, familyMemberRefId: null },
            }, {});
        }

        await updateData(userModel, { _id: isValidObjectId(headId) }, {
            $pull: { familyMembers: { _id: isValidObjectId(memberId) } }
        }, {});

        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${headId}`);
        return responseSuccess(res, responseMessage.deleteDataSuccess("Family member"));
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `user:${id}`;

        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("User"), JSON.parse(cachedData));
        }

        const user = await getFirstMatch(userModel, { _id: isValidObjectId(id), isDeleted: false }, {}, {});
        if (!user) return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"));

        await redisSet(cacheKey, JSON.stringify(user), 600);
        return responseSuccess(res, responseMessage.getDataSuccess("User"), user);
    } catch (error) {
        return internalServerError(res, error);
    }
};