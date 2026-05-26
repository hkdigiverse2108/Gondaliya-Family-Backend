import mongoose, { Schema } from 'mongoose';
import { FEEDBACK_TYPES, FEEDBACK_STATUS } from '../../common';

const feedbackSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    type: { type: String, enum: Object.values(FEEDBACK_TYPES), required: true },
    message: { type: String, required: true },
    status: { type: String, enum: Object.values(FEEDBACK_STATUS), default: FEEDBACK_STATUS.PENDING },
    adminNote: { type: String, default: null }
}, { timestamps: true });

export const feedbackModel = mongoose.model('feedback', feedbackSchema);
