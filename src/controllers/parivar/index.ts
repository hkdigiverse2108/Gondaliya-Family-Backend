import { userModel } from '../../database';
import { responseSuccess, internalServerError } from '../../common';
import { reqInfo, responseMessage, getData, redisGet, redisSet } from '../../helper';

export const getVillages = async (req, res) => {
    reqInfo(req);
    try {
        const cacheKey = 'parivar:villages';
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Villages"), JSON.parse(cachedData));
        }

        const users = await getData(userModel, {
            isDeleted: false,
            isActive: true,
            village: { $nin: [null, ''] }
        }, { village: 1 }, {});

        const villageSet = new Set<string>();
        for (const u of users) {
            if (u.village) villageSet.add(u.village.trim());
        }
        const villages = Array.from(villageSet);
        villages.sort((a, b) => a.localeCompare(b));

        await redisSet(cacheKey, JSON.stringify(villages), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Villages"), villages);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getParivarDirectory = async (req, res) => {
    reqInfo(req);
    try {
        const { village, search } = req.query || {};

        const cacheKey = `parivar:directory:${JSON.stringify(req.query)}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Parivar Directory"), JSON.parse(cachedData));
        }

        let criteria: any = {
            isDeleted: false,
            isActive: true,
            isHeadOfFamily: true
        };

        if (village) {
            criteria.village = { $regex: `^${village.trim()}$`, $options: 'i' };
        }

        if (search) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            criteria.$or = [
                // Head personal/work info
                { firstName: searchRegex },
                { middleName: searchRegex },
                { lastName: searchRegex },
                { currentCity: searchRegex },
                { village: searchRegex },
                { 'workDetails.businessDetails.businessName': searchRegex },
                { 'workDetails.businessDetails.category': searchRegex },
                { 'workDetails.businessDetails.subCategory': searchRegex },
                { 'workDetails.jobDetails.companyName': searchRegex },
                { 'workDetails.jobDetails.jobRole': searchRegex },

                // Family members personal/work info
                { 'familyMembers.firstName': searchRegex },
                { 'familyMembers.middleName': searchRegex },
                { 'familyMembers.lastName': searchRegex },
                { 'familyMembers.relation': searchRegex },
                { 'familyMembers.workDetails.businessDetails.businessName': searchRegex },
                { 'familyMembers.workDetails.businessDetails.category': searchRegex },
                { 'familyMembers.workDetails.jobDetails.companyName': searchRegex }
            ];
        }

        const heads = await getData(userModel, criteria, {}, {});
        const result = heads.map((head: any) => {
            let headWorkSummary = null;
            if (head.workDetails) {
                if (head.workDetails.hasOwnBusiness && head.workDetails.businessDetails?.businessName) {
                    headWorkSummary = `${head.workDetails.businessDetails.businessName} (${head.workDetails.businessDetails.category || ''})`;
                } else if (head.workDetails.jobDetails?.companyName) {
                    headWorkSummary = `${head.workDetails.jobDetails.jobRole || 'Job'} at ${head.workDetails.jobDetails.companyName}`;
                }
            }

            const formattedFamilyMembers = (head.familyMembers || []).map((member: any) => {
                let memberWorkSummary = null;
                if (member.workDetails) {
                    if (member.workDetails.hasOwnBusiness && member.workDetails.businessDetails?.businessName) {
                        memberWorkSummary = `${member.workDetails.businessDetails.businessName} (${member.workDetails.businessDetails.category || ''})`;
                    } else if (member.workDetails.jobDetails?.companyName) {
                        memberWorkSummary = `${member.workDetails.jobDetails.jobRole || 'Job'} at ${member.workDetails.jobDetails.companyName}`;
                    }
                }

                return {
                    _id: member._id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    relation: member.relation,
                    phoneNumber: member.phoneNumber,
                    workDetailsSummary: memberWorkSummary,
                    isIndependent: !!member.isIndependent,
                    linkedUserId: member.isIndependent ? member.linkedUserId : null,
                    profilePhoto: member.profilePhoto || null
                };
            });

            return {
                _id: head._id,
                head: {
                    firstName: head.firstName,
                    lastName: head.lastName,
                    village: head.village,
                    phoneNumber: head.phoneNumber,
                    workDetailsSummary: headWorkSummary,
                    profilePhoto: head.profilePhoto || null
                },
                familyMembers: formattedFamilyMembers
            };
        });

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Parivar Directory"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};
