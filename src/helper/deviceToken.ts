import { userModel } from '../database';
import { isValidObjectId } from '../common';

export const normalizeDeviceTokens = (deviceToken: string | string[]): string[] => {
    const tokens = Array.isArray(deviceToken) ? deviceToken : [deviceToken];
    return tokens.filter((t) => typeof t === 'string' && t.trim().length > 0);
};

export const registerDeviceTokens = async (
    userId: string,
    deviceToken?: string | string[] | null
) => {
    if (!deviceToken) return;
    const tokens = normalizeDeviceTokens(deviceToken);
    if (tokens.length === 0) return;
    await userModel.updateOne(
        { _id: isValidObjectId(userId) },
        { $addToSet: { deviceToken: { $each: tokens } } }
    );
};
