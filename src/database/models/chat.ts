import mongoose, { Schema } from 'mongoose';

const chatSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    message: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO', 'FILE'], default: 'TEXT' },
    messageType: { type: String, enum: ['text', 'give', 'take'], default: 'text' },
    fileSize: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'user', default: null }
}, { timestamps: true });

export const chatModel = mongoose.model('chat', chatSchema);
