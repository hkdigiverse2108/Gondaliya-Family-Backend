import { feedbackModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError, USER_ROLES } from '../../common';
import { reqInfo, responseMessage, createData, updateData, countData, findAllWithPopulate, findOneAndPopulate, redisGet, redisSet, redisDel, redisDelPattern } from '../../helper';

export const createFeedback = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { type, message } = req.body || {};

        const feedback = await createData(feedbackModel, {
            userId: user._id,
            type,
            message,
            status: 'PENDING',
            adminNote: null
        });

        if (!feedback) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.addDataError);
        }

        await redisDelPattern('feedbacks:list:*');

        return responseSuccess(res, responseMessage.addDataSuccess("Feedback/Complaint"), feedback);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getFeedbacks = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { page, limit, type, status } = req.query || {};

        const cacheKey = `feedbacks:list:${JSON.stringify(req.query)}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Feedbacks/Complaints"), JSON.parse(cachedData));
        }

        let criteria: any = {};
        if (type) criteria.type = type;
        if (status) criteria.status = status;

        const totalCount = await countData(feedbackModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 as any }
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const data = await findAllWithPopulate(
            feedbackModel,
            criteria,
            {},
            options,
            { path: 'userId', select: 'firstName lastName phoneNumber' }
        );

        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Feedbacks/Complaints"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateFeedbackStatus = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { id, feedbackId, status, adminNote } = req.body || {};
        const targetId = feedbackId || id;

        const updateFields: any = { status };
        if (adminNote !== undefined) {
            updateFields.adminNote = adminNote;
        }

        const updated = await updateData(feedbackModel, { _id: isValidObjectId(targetId) }, updateFields, {});
        if (!updated) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Feedback/Complaint"));
        }

        await redisDelPattern('feedbacks:list:*');
        await redisDel(`feedbacks:detail:${targetId}`);

        return responseSuccess(res, responseMessage.updateDataSuccess("Feedback/Complaint status"), updated);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getFeedbackById = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { id } = req.params;

        const cacheKey = `feedbacks:detail:${id}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Feedback/Complaint details"), JSON.parse(cachedData));
        }

        const feedback = await findOneAndPopulate(
            feedbackModel,
            { _id: id },
            {},
            {},
            { path: 'userId', select: 'firstName lastName phoneNumber' }
        );

        if (!feedback) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Feedback/Complaint"));
        }

        await redisSet(cacheKey, JSON.stringify(feedback), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Feedback/Complaint details"), feedback);
    } catch (error) {
        return internalServerError(res, error);
    }
};
