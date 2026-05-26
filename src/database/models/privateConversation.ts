import mongoose, { Schema } from 'mongoose';

const privateConversationSchema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: 'user', required: true }],
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: 'user', default: [] }]
}, { timestamps: true });

export const privateConversationModel = mongoose.model('privateConversation', privateConversationSchema);
