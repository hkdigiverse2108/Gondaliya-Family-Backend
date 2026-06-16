import mongoose from 'mongoose';
import { userModel, businessModel } from '../database';

export async function promoteIfHasPhone(headDoc: any): Promise<void> {
    let dirty = false;

    for (const member of headDoc.familyMembers) {
        if (member.phoneNumber && !member.isIndependent) {
            await _promoteToIndependent(headDoc, member);
            dirty = true;
        }
    }

    if (dirty) await headDoc.save();
}

export async function addPhoneToMember(
    headId: string,
    familyMemberRefId: string,
    phoneNumber: string,
): Promise<{ head: any; newUser: any | null }> {
    const head = await userModel.findById(headId);
    if (!head) throw new Error('Head user not found');

    const member = head.familyMembers.id(familyMemberRefId);
    if (!member) throw new Error('Family member not found');
    if (member.isIndependent) throw new Error('This member already has an account');

    member.phoneNumber = phoneNumber;
    const newUser = await _promoteToIndependent(head, member);
    await head.save();

    return { head, newUser };
}
export async function resolveOnSelfRegister(phoneNumber: string): Promise<{
    alreadyLinked: boolean;
    headId?: string;
    familyMemberRefId?: string;
}> {
    const head = await userModel.findOne({
        isDeleted: false,
        'familyMembers.phoneNumber': phoneNumber,
        'familyMembers.isIndependent': false,
    });

    if (!head) return { alreadyLinked: false };

    const member = head.familyMembers.find(
        (m: any) => m.phoneNumber === phoneNumber && !m.isIndependent
    );

    return {
        alreadyLinked: true,
        headId: String(head._id),
        familyMemberRefId: String(member._id),
    };
}
export async function linkSelfRegisteredMember(
    newUserId: string,
    headId: string,
    familyMemberRefId: string,
): Promise<void> {
    const head = await userModel.findById(headId);
    if (!head) throw new Error('Head user not found');

    const member = head.familyMembers.id(familyMemberRefId);
    if (!member) throw new Error('Family member sub-doc not found');

    member.linkedUserId = new mongoose.Types.ObjectId(newUserId);
    member.isIndependent = true;
    await head.save();

    await userModel.findByIdAndUpdate(newUserId, {
        isHeadOfFamily: false,
        linkedFamily: {
            headUserId: new mongoose.Types.ObjectId(headId),
            familyMemberRefId: new mongoose.Types.ObjectId(familyMemberRefId),
        },
    });
}
async function _promoteToIndependent(head: any, member: any): Promise<any | null> {
    const existing = await userModel.findOne({
        phoneNumber: member.phoneNumber,
        isDeleted: false,
    });

    if (existing) {
        member.linkedUserId = existing._id;
        member.isIndependent = true;
        await userModel.findByIdAndUpdate(existing._id, {
            isHeadOfFamily: false,
            linkedFamily: {
                headUserId: head._id,
                familyMemberRefId: member._id,
            },
        });
        return existing;
    }

    const newUser = await new userModel({
        firstName: member.firstName,
        middleName: member.middleName || '',
        lastName: member.lastName || head.lastName,
        profilePhoto: member.profilePhoto || null,
        dob: member.dob || null,
        education: member.education || null,
        isMarried: member.isMarried || null,
        bloodGroup: member.bloodGroup || null,
        phoneNumber: member.phoneNumber,
        nativeVillage: head.nativeVillage,
        nativeTaluka: head.nativeTaluka,
        nativeDistrict: head.nativeDistrict,
        village: head.village,
        pincode: head.pincode,
        taluka: head.taluka,
        district: head.district,
        currentAddress: head.currentAddress,
        currentCity: head.currentCity,
        currentState: head.currentState,
        houseType: head.houseType,
        workDetails: member.workDetails || null,
        isHeadOfFamily: false,
        linkedFamily: {
            headUserId: head._id,
            familyMemberRefId: member._id,
        },
        isActive: true,
        isDeleted: false,
        isLoggedIn: false,
    }).save();

    member.linkedUserId = newUser._id;
    member.isIndependent = true;

    return newUser;
}

export async function populateUserBusinesses(userDoc: any): Promise<any> {
    if (!userDoc) return null;
    
    // Convert to plain object if it is a mongoose document
    const userObj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : JSON.parse(JSON.stringify(userDoc));

    // 1. Fetch Head business
    const headBusiness = await businessModel.findOne({
        userId: userObj._id,
        familyMemberId: null,
        isDeleted: false,
        isActive: true
    });

    userObj.workDetails = userObj.workDetails || {};
    if (headBusiness) {
        userObj.workDetails.hasOwnBusiness = true;
        userObj.workDetails.businessDetails = headBusiness;
    } else {
        userObj.workDetails.hasOwnBusiness = false;
        userObj.workDetails.businessDetails = null;
    }

    // 2. Fetch Family Member businesses
    if (userObj.familyMembers && userObj.familyMembers.length > 0) {
        const memberIds = userObj.familyMembers.map((m: any) => m._id);
        const memberBusinesses = await businessModel.find({
            userId: userObj._id,
            familyMemberId: { $in: memberIds },
            isDeleted: false,
            isActive: true
        });

        const memberBizMap = new Map();
        for (const b of memberBusinesses) {
            memberBizMap.set(String(b.familyMemberId), b);
        }

        userObj.familyMembers = userObj.familyMembers.map((m: any) => {
            const biz = memberBizMap.get(String(m._id));
            m.workDetails = m.workDetails || {};
            if (biz) {
                m.workDetails.hasOwnBusiness = true;
                m.workDetails.businessDetails = biz;
            } else {
                m.workDetails.hasOwnBusiness = false;
                m.workDetails.businessDetails = null;
            }
            return m;
        });
    }

    return userObj;
}

export async function saveUserBusinessesFromPayload(userId: string, workDetails: any, familyMembers: any[]): Promise<void> {
    const uId = new mongoose.Types.ObjectId(userId);

    // 1. Save Head business
    if (workDetails) {
        if (workDetails.hasOwnBusiness && workDetails.businessDetails && workDetails.businessDetails.businessName) {
            const bd = workDetails.businessDetails;
            await businessModel.findOneAndUpdate(
                { userId: uId, familyMemberId: null },
                {
                    $set: {
                        category: bd.category || null,
                        subCategory: bd.subCategory || [],
                        businessName: bd.businessName,
                        ownerName: bd.ownerName || null,
                        description: bd.description || null,
                        locations: bd.locations || [],
                        contactInfo: bd.contactInfo || {},
                        isDeleted: false,
                        isActive: true
                    }
                },
                { upsert: true, new: true }
            );
        } else if (workDetails.hasOwnBusiness === false) {
            await businessModel.findOneAndUpdate(
                { userId: uId, familyMemberId: null },
                { $set: { isDeleted: true } }
            );
        }
    }

    // 2. Save Family Member businesses
    if (familyMembers && Array.isArray(familyMembers)) {
        for (const member of familyMembers) {
            if (member._id && member.workDetails) {
                if (member.workDetails.hasOwnBusiness && member.workDetails.businessDetails && member.workDetails.businessDetails.businessName) {
                    const bd = member.workDetails.businessDetails;
                    const mId = new mongoose.Types.ObjectId(member._id);
                    await businessModel.findOneAndUpdate(
                        { userId: uId, familyMemberId: mId },
                        {
                            $set: {
                                category: bd.category || null,
                                subCategory: bd.subCategory || [],
                                businessName: bd.businessName,
                                ownerName: bd.ownerName || null,
                                description: bd.description || null,
                                locations: bd.locations || [],
                                contactInfo: bd.contactInfo || {},
                                isDeleted: false,
                                isActive: true
                            }
                        },
                        { upsert: true, new: true }
                    );
                } else if (member.workDetails.hasOwnBusiness === false) {
                    const mId = new mongoose.Types.ObjectId(member._id);
                    await businessModel.findOneAndUpdate(
                        { userId: uId, familyMemberId: mId },
                        { $set: { isDeleted: true } }
                    );
                }
            }
        }
    }
}
