import { userModel } from '../../database';
import { responseSuccess, responseError, internalServerError, HTTP_STATUS, generateHash, compareHash, generateToken, USER_ROLES } from '../../common';
import { responseMessage, redisSet, redisGet, redisDel, getFirstMatch, createData, updateData, promoteIfHasPhone, resolveOnSelfRegister, linkSelfRegisteredMember } from '../../helper';

export const signUp = async (req, res) => {
    try {
        const { firstName, middleName, lastName, dob, bloodGroup, education, isMarried, profilePhoto, email, password, phoneNumber, phoneNumber2, role, nativeVillage, nativeTaluka, nativeDistrict, village, pincode, taluka, district, currentAddress, currentCity, currentState, houseType, familyMembers, workDetails } = req.body;

        if (email) {
            const isEmailExist = await getFirstMatch(userModel, { email, isDeleted: false }, {}, {});
            if (isEmailExist) {
                return responseError(res, HTTP_STATUS.CONFLICT, responseMessage.alreadyEmail);
            }
        }

        // Gather all phone numbers to assert global uniqueness
        const incomingPhones: string[] = [];
        if (phoneNumber) incomingPhones.push(phoneNumber);
        if (phoneNumber2) incomingPhones.push(phoneNumber2);
        if (familyMembers && Array.isArray(familyMembers)) {
            for (const member of familyMembers) {
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

        const selfRegisterLink = await resolveOnSelfRegister(phoneNumber);

        const hashedPassword = await generateHash(password);

        const newUser = await createData(userModel, {
            firstName,
            middleName,
            lastName,
            dob: dob || null,
            bloodGroup: bloodGroup || null,
            education: education || null,
            isMarried: isMarried || null,
            profilePhoto: profilePhoto || null,
            email: email || null,
            password: hashedPassword,
            phoneNumber,
            phoneNumber2: phoneNumber2 || null,
            role: role || USER_ROLES.USER,
            isActive: true,
            isDeleted: false,
            nativeVillage:  nativeVillage  || null,
            nativeTaluka:   nativeTaluka   || null,
            nativeDistrict: nativeDistrict || null,
            village: village || null,
            pincode: pincode || null,
            taluka: taluka || null,
            district: district || null,
            currentAddress: currentAddress || null,
            currentCity:    currentCity    || null,
            currentState:   currentState   || null,
            houseType: houseType || null,
            familyMembers: familyMembers || [],
            workDetails: workDetails || null,
            // If linked to a family, mark as non-head
            isHeadOfFamily: !selfRegisterLink.alreadyLinked,
        });

        // Auto-create accounts for family members that already have a phone number
        if (newUser.familyMembers?.length) {
            await promoteIfHasPhone(newUser);
        }

        if (selfRegisterLink.alreadyLinked) {
            await linkSelfRegisteredMember(
                String(newUser._id),
                selfRegisterLink.headId!,
                selfRegisterLink.familyMemberRefId!
            );
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisSet(`otp:${phoneNumber}`, otp, 600);

        return responseSuccess(res, "OTP generated successfully! Please verify your phone number using this OTP.", {
            phoneNumber,
            otp
        });
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const otpVerification = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        const storedOtp = await redisGet(`otp:${phoneNumber}`);
        if (!storedOtp || storedOtp !== otp.toString()) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.invalidOTP);
        }

        const user = await updateData(userModel,
            { phoneNumber, isDeleted: false },
            { isPhoneVerified: true },
            {}
        );

        if (!user) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "User not found with this phone number!");
        }

        // Delete OTP from Redis after successful verification
        await redisDel(`otp:${phoneNumber}`);

        const token = await generateToken({
            _id: user._id,
            role: user.role,
            status: "Login"
        });

        return responseSuccess(res, responseMessage.OTPVerified, {
            _id: user._id,
            phoneNumber: user.phoneNumber,
            role: user.role,
            token
        });
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        const user = await getFirstMatch(userModel, { phoneNumber, isDeleted: false }, {}, {});
        if (!user) {
            return responseError(res, HTTP_STATUS.UNAUTHORIZED, "Invalid phone number or password!");
        }

        if (!user.isActive) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock);
        }

        const isPasswordMatch = await compareHash(password, user.password);
        if (!isPasswordMatch) {
            return responseError(res, HTTP_STATUS.UNAUTHORIZED, "Invalid phone number or password!");
        }

        const token = await generateToken({
            _id: user._id,
            role: user.role,
            status: "Login"
        });

        return responseSuccess(res, responseMessage.loginSuccess, {
            _id: user._id,
            phoneNumber: user.phoneNumber,
            role: user.role,
            token
        });
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        const user = await getFirstMatch(userModel, { phoneNumber, isDeleted: false }, {}, {});
        if (!user) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "User not found with this phone number!");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisSet(`otp:${phoneNumber}`, otp, 600);

        return responseSuccess(res, "OTP generated successfully for password reset.", {
            phoneNumber,
            otp // Returning OTP in response for easy testing since email is removed/optional
        });
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        const hashedPassword = await generateHash(password);

        const user = await updateData(userModel,
            { phoneNumber, isDeleted: false },
            { password: hashedPassword },
            {}
        );

        if (!user) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.resetPasswordError);
        }

        return responseSuccess(res, responseMessage.resetPasswordSuccess);
    } catch (error) {
        return internalServerError(res, error);
    }
};
