import mongoose, { Schema } from 'mongoose';

const supportSchema = new Schema({
    phones: { type: [String], default: [] },
    email: { type: String, required: true },
    address: { type: String, default: null }
}, { timestamps: true });

export const supportModel = mongoose.model('support', supportSchema);
