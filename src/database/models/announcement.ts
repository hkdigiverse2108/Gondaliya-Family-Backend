import mongoose, { Schema } from 'mongoose';

const announcementSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const announcementModel = mongoose.model('announcement', announcementSchema);
