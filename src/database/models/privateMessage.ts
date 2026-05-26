import mongoose, { Schema } from 'mongoose';

const privateMessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'privateConversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    message: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'give', 'take'], required: true },
    relatedListingId: { type: Schema.Types.ObjectId, ref: 'listing', default: null },
    isRead: { type: Boolean, default: false },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: 'user', default: [] }]
}, { timestamps: true });

export const privateMessageModel = mongoose.model('privateMessage', privateMessageSchema);
