import mongoose, { Schema } from 'mongoose';

const privateMessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'privateConversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    message: { type: String, default: null },
    messageType: { type: String, enum: ['text', 'give', 'take'], default: 'text' },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO', 'FILE'], default: 'TEXT' },
    fileSize: { type: Number, default: 0 },
    relatedListingId: { type: Schema.Types.ObjectId, ref: 'listing', default: null },
    isRead: { type: Boolean, default: false },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: 'user', default: [] }]
}, { timestamps: true });

export const privateMessageModel = mongoose.model('privateMessage', privateMessageSchema);
