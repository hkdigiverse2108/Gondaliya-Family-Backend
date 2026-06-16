import { userModel, businessModel } from '../../database';
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

        let searchUserIds: any[] = [];
        let searchFamilyMemberIds: any[] = [];
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const matchingBusinesses = await businessModel.find({
                isDeleted: false,
                isActive: true,
                $or: [
                    { businessName: searchRegex },
                    { category: searchRegex },
                    { subCategory: searchRegex },
                    { description: searchRegex }
                ]
            }, { userId: 1, familyMemberId: 1 });

            searchUserIds = matchingBusinesses.map(b => b.userId);
            searchFamilyMemberIds = matchingBusinesses.filter(b => b.familyMemberId).map(b => b.familyMemberId!);
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
                { 'workDetails.jobDetails.companyName': searchRegex },
                { 'workDetails.jobDetails.jobRole': searchRegex },

                // Family members personal/work info
                { 'familyMembers.firstName': searchRegex },
                { 'familyMembers.middleName': searchRegex },
                { 'familyMembers.lastName': searchRegex },
                { 'familyMembers.relation': searchRegex },
                { 'familyMembers.workDetails.jobDetails.companyName': searchRegex }
            ];

            if (searchUserIds.length > 0) {
                criteria.$or.push({ _id: { $in: searchUserIds } });
            }
            if (searchFamilyMemberIds.length > 0) {
                criteria.$or.push({ 'familyMembers._id': { $in: searchFamilyMemberIds } });
            }
        }

        const heads = await getData(userModel, criteria, {}, {});

        const headIds = heads.map((h: any) => h._id);
        const memberIds = heads.flatMap((h: any) => (h.familyMembers || []).map((m: any) => m._id));

        const allBusinesses = await businessModel.find({
            isDeleted: false,
            isActive: true,
            $or: [
                { userId: { $in: headIds }, familyMemberId: null },
                { familyMemberId: { $in: memberIds } }
            ]
        });

        const headBusinessesMap = new Map<string, any[]>();
        const memberBusinessesMap = new Map<string, any[]>();

        for (const b of allBusinesses) {
            if (b.familyMemberId) {
                const key = String(b.familyMemberId);
                if (!memberBusinessesMap.has(key)) memberBusinessesMap.set(key, []);
                memberBusinessesMap.get(key)!.push(b);
            } else {
                const key = String(b.userId);
                if (!headBusinessesMap.has(key)) headBusinessesMap.set(key, []);
                headBusinessesMap.get(key)!.push(b);
            }
        }

        const result = heads.map((head: any) => {
            let headWorkSummary = null;
            if (head.workDetails && head.workDetails.jobDetails && head.workDetails.jobDetails.companyName) {
                headWorkSummary = `${head.workDetails.jobDetails.jobRole || 'Job'} at ${head.workDetails.jobDetails.companyName}`;
            } else {
                const userBizs = headBusinessesMap.get(String(head._id)) || [];
                if (userBizs.length > 0) {
                    headWorkSummary = userBizs.map((b: any) => `${b.businessName} (${b.category || ''})`).join(', ');
                }
            }

            const formattedFamilyMembers = (head.familyMembers || []).map((member: any) => {
                let memberWorkSummary = null;
                if (member.workDetails && member.workDetails.jobDetails && member.workDetails.jobDetails.companyName) {
                    memberWorkSummary = `${member.workDetails.jobDetails.jobRole || 'Job'} at ${member.workDetails.jobDetails.companyName}`;
                } else {
                    const memberBizs = memberBusinessesMap.get(String(member._id)) || [];
                    if (memberBizs.length > 0) {
                        memberWorkSummary = memberBizs.map((b: any) => `${b.businessName} (${b.category || ''})`).join(', ');
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
