import mongoose, { Schema } from 'mongoose';
import { NOTIFICATION_TYPES } from '../../common';

const notificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

export const notificationModel = mongoose.model('notification', notificationSchema);
