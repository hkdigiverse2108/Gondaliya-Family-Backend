import { inquiryModel, listingModel, userModel, businessModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError, NOTIFICATION_TYPES } from '../../common';
import { reqInfo, responseMessage, createData, updateData, getFirstMatch, getData, countData, findAllWithPopulate, dispatchNotification, redisGet, redisSet, redisDelPattern } from '../../helper';

export const createInquiry = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { targetType, targetId, message } = req.body || {};

        let ownerId: any = null;

        if (targetType === 'LISTING') {
            const listing = await getFirstMatch(listingModel, { _id: isValidObjectId(targetId), isDeleted: false }, {}, {});
            if (!listing) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, "Listing not found!");
            }
            ownerId = listing.postedBy;
        } else if (targetType === 'BUSINESS') {
            const business = await getFirstMatch(businessModel, { _id: isValidObjectId(targetId), isDeleted: false }, {}, {});
            if (!business) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, "Business not found!");
            }
            ownerId = business.userId;
        }

        if (!ownerId) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Invalid inquiry target!");
        }

        const inquiry = await createData(inquiryModel, {
            senderId: user._id,
            targetType,
            targetId,
            message,
            reply: null,
            isRead: false
        });

        if (!inquiry) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.addDataError);
        }

        const title = 'New Inquiry Received';
        const body = `${user.firstName} ${user.lastName} sent an inquiry: "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`;

        await dispatchNotification({
            userId: String(ownerId),
            title,
            body,
            type: NOTIFICATION_TYPES.INQUIRY,
            refId: String(inquiry._id),
        });

        await redisDelPattern('inquiries:*');

        return responseSuccess(res, responseMessage.addDataSuccess("Inquiry"), inquiry);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getReceivedInquiries = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { page, limit } = req.query || {};

        const cacheKey = `inquiries:received:${JSON.stringify(req.query)}:${user?._id}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Received Inquiries"), JSON.parse(cachedData));
        }

        const myListings = await getData(listingModel, { postedBy: user._id, isDeleted: false }, { _id: 1 }, {});
        const listingIds = myListings.map(l => l._id);

        const myBusinesses = await businessModel.find({ userId: user._id, isDeleted: false }, { _id: 1 });
        const businessIds = myBusinesses.map(b => b._id);

        const criteria = {
            $or: [
                { targetType: 'BUSINESS', targetId: { $in: [user._id, ...businessIds] } },
                { targetType: 'LISTING', targetId: { $in: listingIds } }
            ]
        };

        const totalCount = await countData(inquiryModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 as any }
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const inquiries = await findAllWithPopulate(
            inquiryModel,
            criteria,
            {},
            options,
            { path: 'senderId', select: 'firstName lastName phoneNumber profilePhoto' }
        );

        const populated = await Promise.all(inquiries.map(async (inq: any) => {
            let targetDetails: any = null;
            if (inq.targetType === 'LISTING') {
                targetDetails = await getFirstMatch(listingModel, { _id: inq.targetId }, { title: 1, type: 1 }, {});
            } else if (inq.targetType === 'BUSINESS') {
                targetDetails = await getFirstMatch(businessModel, { _id: inq.targetId }, { businessName: 1, category: 1 }, {});
                if (!targetDetails) {
                    // Fallback to userModel for legacy inquiries
                    const u = await getFirstMatch(userModel, { _id: inq.targetId }, { firstName: 1, lastName: 1, workDetails: 1 }, {});
                    if (u) {
                        targetDetails = {
                            businessName: u.workDetails?.businessDetails?.businessName || `${u.firstName}'s Business`,
                            category: u.workDetails?.businessDetails?.category || null
                        };
                    }
                }
            }
            return {
                ...inq,
                targetDetails
            };
        }));

        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data: populated,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Received Inquiries"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getSentInquiries = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { page, limit } = req.query || {};

        const cacheKey = `inquiries:sent:${JSON.stringify(req.query)}:${user?._id}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Sent Inquiries"), JSON.parse(cachedData));
        }

        const criteria = { senderId: user._id };
        const totalCount = await countData(inquiryModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 as any }
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const inquiries = await findAllWithPopulate(
            inquiryModel,
            criteria,
            {},
            options,
            { path: 'senderId', select: 'firstName lastName phoneNumber' }
        );

        const populated = await Promise.all(inquiries.map(async (inq: any) => {
            let targetDetails: any = null;
            if (inq.targetType === 'LISTING') {
                targetDetails = await getFirstMatch(listingModel, { _id: inq.targetId }, { title: 1, type: 1 }, {});
            } else if (inq.targetType === 'BUSINESS') {
                targetDetails = await getFirstMatch(businessModel, { _id: inq.targetId }, { businessName: 1, category: 1 }, {});
                if (!targetDetails) {
                    // Fallback to userModel for legacy inquiries
                    const u = await getFirstMatch(userModel, { _id: inq.targetId }, { firstName: 1, lastName: 1, workDetails: 1 }, {});
                    if (u) {
                        targetDetails = {
                            businessName: u.workDetails?.businessDetails?.businessName || `${u.firstName}'s Business`,
                            category: u.workDetails?.businessDetails?.category || null
                        };
                    }
                }
            }
            return {
                ...inq,
                targetDetails
            };
        }));

        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data: populated,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Sent Inquiries"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const replyInquiry = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { id, inquiryId, reply } = req.body || {};
        const targetId = inquiryId || id;

        const inquiry = await getFirstMatch(inquiryModel, { _id: isValidObjectId(targetId) }, {}, {});
        if (!inquiry) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "Inquiry not found!");
        }

        // Validate that this user is the actual target/owner
        let isAuthorized = false;
        if (inquiry.targetType === 'BUSINESS') {
            // Check if user owns the business
            const business = await getFirstMatch(businessModel, { _id: inquiry.targetId }, {}, {});
            if (business && String(business.userId) === String(user._id)) {
                isAuthorized = true;
            } else {
                // Fallback for legacy inquiries where targetId was userId
                if (String(inquiry.targetId) === String(user._id)) {
                    isAuthorized = true;
                }
            }
        } else if (inquiry.targetType === 'LISTING') {
            const listing = await getFirstMatch(listingModel, { _id: inquiry.targetId }, {}, {});
            if (listing && String(listing.postedBy) === String(user._id)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, "Only the owner can reply to this inquiry!");
        }

        const updated = await updateData(inquiryModel, { _id: inquiry._id }, { reply, repliedAt: new Date() }, {});

        const title = 'Reply to Inquiry Received';
        const body = `${user.firstName} ${user.lastName} replied: "${reply.substring(0, 40)}${reply.length > 40 ? '...' : ''}"`;

        await dispatchNotification({
            userId: String(inquiry.senderId),
            title,
            body,
            type: NOTIFICATION_TYPES.REPLY,
            refId: String(inquiry._id),
        });

        await redisDelPattern('inquiries:*');

        return responseSuccess(res, responseMessage.updateDataSuccess("Inquiry reply"), updated);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const readInquiry = async (req, res) => {
    reqInfo(req);
    try {
        const { id, inquiryId } = req.body || {};
        const targetId = inquiryId || id;

        const updated = await updateData(inquiryModel, { _id: isValidObjectId(targetId) }, { isRead: true }, {});
        if (!updated) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "Inquiry not found!");
        }

        await redisDelPattern('inquiries:*');

        return responseSuccess(res, "Inquiry marked as read successfully!");
    } catch (error) {
        return internalServerError(res, error);
    }
};
