import mongoose, { Schema } from 'mongoose';

const listingSchema = new Schema({
    postedBy: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    type: { type: String, enum: ['RENT', 'SEASONAL', 'SECONDHAND'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    photos: [{ type: String }],
    price: { type: Number, required: true },
    priceUnit: { type: String, enum: ['PER_DAY', 'PER_MONTH', 'FIXED'], required: true },
    availableFrom: { type: Date, required: true },
    availableTo: { type: Date, default: null },
    location: {
        city: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    contactPhone: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'SOLD', 'CLOSED'], default: 'ACTIVE' },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const listingModel = mongoose.model('listing', listingSchema);
