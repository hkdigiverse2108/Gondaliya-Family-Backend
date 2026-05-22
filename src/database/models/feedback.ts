import mongoose, { Schema } from 'mongoose';

const feedbackSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    type: { type: String, enum: ['FEEDBACK', 'COMPLAINT'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'REVIEWED', 'RESOLVED'], default: 'PENDING' },
    adminNote: { type: String, default: null }
}, { timestamps: true });

export const feedbackModel = mongoose.model('feedback', feedbackSchema);
