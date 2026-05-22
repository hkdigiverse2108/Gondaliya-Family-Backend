import mongoose, { Schema } from 'mongoose';

const supportSchema = new Schema({
    phone: { type: String, required: true },
    phone2: { type: String, default: null },
    email: { type: String, required: true },
    address: { type: String, default: null }
}, { timestamps: true });

export const supportModel = mongoose.model('support', supportSchema);
