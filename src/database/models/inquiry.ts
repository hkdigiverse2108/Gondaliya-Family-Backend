import mongoose, { Schema } from 'mongoose';

const inquirySchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    targetType: { type: String, enum: ['BUSINESS', 'LISTING'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true }, // Referencing user (business owner) or listing
    message: { type: String, maxlength: 500, required: true },
    reply: { type: String, default: null },
    repliedAt: { type: Date, default: null },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const inquiryModel = mongoose.model('inquiry', inquirySchema);
