import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBusiness extends Document {
    userId: Types.ObjectId;
    familyMemberId: Types.ObjectId | null;
    category: string | null;
    subCategory: string[];
    businessName: string;
    ownerName: string | null;
    description: string | null;
    businessLogo: string | null;
    businessBanner: string | null;
    businessPhotos: string[];
    locations: Array<{
        shopAddress: string | null;
        areaCity: string | null;
        state: string | null;
        pincode: string | null;
        googleMapLink: string | null;
    }>;
    contactInfo: {
        mobile1: string | null;
        mobile2: string | null;
        email: string | null;
        website: string | null;
        portfolioLink: string | null;
    };
    isDeleted: boolean;
    isActive: boolean;
}

const businessSchema = new Schema<IBusiness>({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    familyMemberId: { type: Schema.Types.ObjectId, default: null },
    category: { type: String, default: null },
    subCategory: { type: [String], default: [] },
    businessName: { type: String, required: true },
    ownerName: { type: String, default: null },
    description: { type: String, default: null },
    businessLogo: { type: String, default: null },
    businessBanner: { type: String, default: null },
    businessPhotos: { type: [String], default: [] },
    locations: [{
        shopAddress: { type: String, default: null },
        areaCity: { type: String, default: null },
        state: { type: String, default: null },
        pincode: { type: String, default: null },
        googleMapLink: { type: String, default: null },
    }],
    contactInfo: {
        mobile1: { type: String, default: null },
        mobile2: { type: String, default: null },
        email: { type: String, default: null },
        website: { type: String, default: null },
        portfolioLink: { type: String, default: null },
    },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const businessModel = mongoose.model<IBusiness>('business', businessSchema);
