import mongoose from 'mongoose';

const locationSchema: any = new mongoose.Schema({
    village: { type: String, required: true },
    taluka: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const locationModel = mongoose.model('location', locationSchema);
