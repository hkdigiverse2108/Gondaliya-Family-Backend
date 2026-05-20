import mongoose from 'mongoose';
import { USER_ROLES, HOUSE_TYPES, MARITAL_STATUS, BLOOD_GROUPS, RELATIONS } from '../../common';

const userSchema: any = new mongoose.Schema({
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String },
    profilePhoto: { type: String },
    otp: { type: Number, default: null },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.USER },
    village: { type: String, default: null },
    pincode: { type: String, default: null },
    taluka: { type: String, default: null },
    district: { type: String, default: null },
    currentAddress: { type: String, default: null },
    houseType: { type: String, enum: Object.values(HOUSE_TYPES), default: null },
    phoneNumber2: { type: String, default: null },
    familyMembers: [{
        fullName: { type: String, default: null },
        relation: { type: String, enum: Object.values(RELATIONS), default: null },
        dob: { type: String, default: null },
        education: { type: String, default: null },
        occupation: { type: String, default: null },
        isMarried: { type: String, enum: Object.values(MARITAL_STATUS), default: null },
        bloodGroup: { type: String, enum: Object.values(BLOOD_GROUPS), default: null },
        skills: { type: String, default: null },
        phoneNumber: { type: String, default: null }
    }],
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isLoggedIn: { type: Boolean, default: false },
}, { timestamps: true })

export const userModel = mongoose.model('user', userSchema);