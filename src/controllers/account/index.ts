import path from 'path';
import { userModel } from '../../database';
import { responseSuccess, responseError, internalServerError, HTTP_STATUS, compareHash } from '../../common';
import { getFirstMatch, updateData, redisDel, redisDelPattern } from '../../helper';

/**
 * Render the account deletion EJS page
 */
export const renderDeletePage = async (req, res) => {
    try {
        res.render('delete-account');
    } catch (error) {
        return internalServerError(res, error);
    }
};

/**
 * Process account deletion request
 * - Verify phone number and password
 * - Soft-delete the user and all associated data
 */
export const processDeleteAccount = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        if (!phoneNumber || !password) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Phone number and password are required!");
        }

        if (phoneNumber.length !== 10) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Please enter a valid 10-digit phone number!");
        }

        // Find user by phone number
        const user = await getFirstMatch(userModel, { phoneNumber, isDeleted: false }, {}, {});
        if (!user) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "No account found with this phone number!");
        }

        // Verify password
        const isPasswordMatch = await compareHash(password, user.password);
        if (!isPasswordMatch) {
            return responseError(res, HTTP_STATUS.UNAUTHORIZED, "Invalid password! Please check and try again.");
        }

        const userId = String(user._id);

        // 1. Soft-delete the user
        await updateData(userModel, { _id: user._id }, { isDeleted: true, isActive: false }, {});

        // 2. If user was head of family, handle linked family members
        if (user.isHeadOfFamily && user.familyMembers?.length > 0) {
            for (const member of user.familyMembers) {
                if (member.isIndependent && member.linkedUserId) {
                    // Unlink independent family members -> make them independent heads
                    await updateData(userModel, { _id: member.linkedUserId }, {
                        isHeadOfFamily: true,
                        linkedFamily: { headUserId: null, familyMemberRefId: null },
                    }, {});
                }
            }
        }

        // 3. If user was linked to a head of family, remove from head's familyMembers
        if (!user.isHeadOfFamily && user.linkedFamily?.headUserId) {
            const headId = user.linkedFamily.headUserId;
            const memberRefId = user.linkedFamily.familyMemberRefId;

            if (memberRefId) {
                await updateData(
                    userModel,
                    { _id: headId },
                    { $pull: { familyMembers: { _id: memberRefId } } },
                    {}
                );
            }
        }

        // 4. Clear all related caches
        await redisDelPattern(`users:list:*`);
        await redisDel(`user:${userId}`);
        await redisDel('parivar:villages');
        await redisDelPattern('parivar:directory:*');

        return responseSuccess(res, "Your account has been permanently deleted. Thank you for using Gondaliya Family App.");
    } catch (error) {
        console.error("Error in processDeleteAccount:", error);
        return internalServerError(res, error);
    }
};
