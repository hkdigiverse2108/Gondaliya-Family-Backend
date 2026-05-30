import { supportModel } from '../../database';
import { HTTP_STATUS, responseSuccess, responseError, internalServerError, USER_ROLES } from '../../common';
import { reqInfo, responseMessage, createData, updateData, getFirstMatch, redisGet, redisSet, redisDel } from '../../helper';

export const getSupportContact = async (req, res) => {
    reqInfo(req);
    try {
        const cacheKey = 'support:contact';
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Support contact details"), JSON.parse(cachedData));
        }

        let support: any = await getFirstMatch(supportModel, {}, {}, {});

        await redisSet(cacheKey, JSON.stringify(support), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Support contact details"), support);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateSupportContact = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { phones, email, address } = req.body;

        let support = await getFirstMatch(supportModel, {}, {}, {});

        if (!support) {
            // Create a new settings document
            support = await createData(supportModel, {
                phones,
                email,
                address: address || null
            });
        } else {
            // Update the existing document
            support = await updateData(supportModel, { _id: support._id }, {
                phones,
                email,
                address: address || null
            }, {});
        }

        await redisDel('support:contact');

        return responseSuccess(res, responseMessage.updateDataSuccess("Support contact details"), support);
    } catch (error) {
        return internalServerError(res, error);
    }
};

