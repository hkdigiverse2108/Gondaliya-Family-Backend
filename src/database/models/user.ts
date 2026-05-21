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
        firstName: { type: String },
        middleName: { type: String },
        lastName: { type: String },
        relation: { type: String, enum: Object.values(RELATIONS), default: null },
        dob: { type: String, default: null },
        education: { type: String, default: null },
        occupation: { type: String, default: null },
        isMarried: { type: String, enum: Object.values(MARITAL_STATUS), default: null },
        bloodGroup: { type: String, enum: Object.values(BLOOD_GROUPS), default: null },
        skills: { type: String, default: null },
        phoneNumber: { type: String, default: null }
    }],
    workDetails: {
        hasOwnBusiness: { type: Boolean, default: null },
        businessDetails: {
            category: { type: String, default: null },
            subCategory: { type: String, default: null },
            businessName: { type: String, default: null },
            ownerName: { type: String, default: null },
            description: { type: String, default: null },
            locations: [{
                shopAddress: { type: String, default: null },
                areaCity: { type: String, default: null },
                state: { type: String, default: null },
                pincode: { type: String, default: null },
                googleMapLink: { type: String, default: null }
            }],
            contactInfo: {
                mobile1: { type: String, default: null },
                mobile2: { type: String, default: null },
                email: { type: String, default: null },
                website: { type: String, default: null },
                portfolioLink: { type: String, default: null }
            }
        },
        jobDetails: {
            jobCategory: { type: String, default: null },
            jobRole: { type: String, default: null },
            companyName: { type: String, default: null },
            jobLocation: { type: String, default: null }
        }
    },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isLoggedIn: { type: Boolean, default: false },
}, { timestamps: true })

export const userModel = mongoose.model('user', userSchema);