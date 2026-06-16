import mongoose, { Schema, Document, Types } from 'mongoose';
import { USER_ROLES, HOUSE_TYPES, MARITAL_STATUS, BLOOD_GROUPS, RELATIONS } from '../../common';

export interface IFamilyMember {
    _id: Types.ObjectId;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    profilePhoto: string | null;
    relation: string | null;
    dob: string | null;
    education: string | null;
    isMarried: string | null;
    bloodGroup: string | null;
    phoneNumber: string | null;
    workDetails: any | null;
    linkedUserId: Types.ObjectId | null;
    isIndependent: boolean;
    [key: string]: any;
}
export interface IUser extends Document {
    firstName: string;
    middleName: string;
    lastName: string;
    profilePhoto: string | null;
    dob: string | null;
    education: string | null;
    isMarried: string | null;
    bloodGroup: string | null;
    phoneNumber: string;
    phoneNumber2: string | null;
    password: string;
    otp: number | null;
    role: string;
    // Native place (origin)
    nativeVillage: string | null;
    nativeTaluka: string | null;
    nativeDistrict: string | null;
    // Current address
    village: string | null;
    pincode: string | null;
    taluka: string | null;
    district: string | null;
    currentAddress: string | null;
    currentCity: string | null;
    currentState: string | null;
    houseType: string | null;
    familyMembers: mongoose.Types.DocumentArray<IFamilyMember & Document>;
    isHeadOfFamily: boolean;
    linkedFamily: {
        headUserId: Types.ObjectId | null;
        familyMemberRefId: Types.ObjectId | null;
    };
    workDetails: any | null;
    isDeleted: boolean;
    isActive: boolean;
    isLoggedIn: boolean;
    deviceToken: string[] | null;
}

const workDetailsSchema = new Schema({
    jobDetails: {
        jobCategory: { type: String, default: null },
        jobRole: { type: String, default: null },
        companyName: { type: String, default: null },
        jobLocation: { type: String, default: null },
    },
}, { _id: false });

const familyMemberSchema = new Schema({
    firstName: { type: String, default: null },
    middleName: { type: String, default: null },
    lastName: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    relation: { type: String, enum: Object.values(RELATIONS), default: null },
    dob: { type: String, default: null },
    education: { type: String, default: null },
    isMarried: { type: String, enum: Object.values(MARITAL_STATUS), default: null },
    bloodGroup: { type: String, enum: Object.values(BLOOD_GROUPS), default: null },
    phoneNumber: { type: String, default: null },
    workDetails: { type: workDetailsSchema, default: null },
    linkedUserId: { type: Schema.Types.ObjectId, ref: 'user', default: null },
    isIndependent: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema<IUser>({
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePhoto: { type: String, default: null },
    dob: { type: String, default: null },
    education: { type: String, default: null },
    isMarried: { type: String, enum: Object.values(MARITAL_STATUS), default: null },
    bloodGroup: { type: String, enum: Object.values(BLOOD_GROUPS), default: null },

    phoneNumber: { type: String, required: true, unique: true },
    phoneNumber2: { type: String, default: null },
    password: { type: String },
    otp: { type: Number, default: null },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.USER },

    // Native place (origin village / taluka / district)
    nativeVillage: { type: String, default: null },
    nativeTaluka: { type: String, default: null },
    nativeDistrict: { type: String, default: null },

    // Current address
    village: { type: String, default: null },
    pincode: { type: String, default: null },
    taluka: { type: String, default: null },
    district: { type: String, default: null },
    currentAddress: { type: String, default: null },
    currentCity: { type: String, default: null },
    currentState: { type: String, default: null },
    houseType: { type: String, enum: Object.values(HOUSE_TYPES), default: null },

    familyMembers: [familyMemberSchema],
    isHeadOfFamily: { type: Boolean, default: true },
    linkedFamily: {
        headUserId: { type: Schema.Types.ObjectId, ref: 'user', default: null },
        familyMemberRefId: { type: Schema.Types.ObjectId, default: null },
    },

    // Work
    workDetails: { type: workDetailsSchema, default: null },

    // Status
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isLoggedIn: { type: Boolean, default: false },
    deviceToken: { type: [String], default: [] },

}, { timestamps: true });

export const userModel = mongoose.model<IUser>('user', userSchema);