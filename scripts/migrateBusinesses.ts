import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { userModel, businessModel } from '../src/database';

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
    console.error("Error: DB_URL environment variable is not defined in .env");
    process.exit(1);
}

async function runMigration() {
    try {
        console.log("Fetching all users (including raw schema-less data)...");
        const users = await userModel.find({ isDeleted: false }).lean();
        console.log(`Found ${users.length} active users to check.`);

        let migratedHeadsCount = 0;
        let migratedMembersCount = 0;

        for (const user of users) {
            const workDetails = (user as any).workDetails;
            if (workDetails && workDetails.hasOwnBusiness && workDetails.businessDetails) {
                const bd = workDetails.businessDetails;
                if (bd.businessName) {
                    console.log(`[Head] Migrating business for user ${user._id} (${user.firstName} ${user.lastName}): ${bd.businessName}`);
                    await businessModel.findOneAndUpdate(
                        { userId: user._id, familyMemberId: null },
                        {
                            $set: {
                                category: bd.category || null,
                                subCategory: bd.subCategory || [],
                                businessName: bd.businessName,
                                ownerName: bd.ownerName || null,
                                description: bd.description || null,
                                locations: bd.locations || [],
                                contactInfo: bd.contactInfo || {},
                                isDeleted: false,
                                isActive: true
                            }
                        },
                        { upsert: true, new: true }
                    );
                    migratedHeadsCount++;
                }
            }

            const familyMembers = (user as any).familyMembers;
            if (familyMembers && Array.isArray(familyMembers)) {
                for (const member of familyMembers) {
                    const mWorkDetails = member.workDetails;
                    if (mWorkDetails && mWorkDetails.hasOwnBusiness && mWorkDetails.businessDetails) {
                        const bd = mWorkDetails.businessDetails;
                        if (bd.businessName) {
                            console.log(`[Member] Migrating business for family member ${member._id} (${member.firstName} ${member.lastName}) under user ${user._id}: ${bd.businessName}`);
                            await businessModel.findOneAndUpdate(
                                { userId: user._id, familyMemberId: member._id },
                                {
                                    $set: {
                                        category: bd.category || null,
                                        subCategory: bd.subCategory || [],
                                        businessName: bd.businessName,
                                        ownerName: bd.ownerName || null,
                                        description: bd.description || null,
                                        locations: bd.locations || [],
                                        contactInfo: bd.contactInfo || {},
                                        isDeleted: false,
                                        isActive: true
                                    }
                                },
                                { upsert: true, new: true }
                              );
                            migratedMembersCount++;
                        }
                    }
                }
            }
        }

        console.log("\nMigration completed successfully!");
        console.log(`Migrated head businesses: ${migratedHeadsCount}`);
        console.log(`Migrated family member businesses: ${migratedMembersCount}`);
    } catch (error) {
        console.error("Error running migration:", error);
    } finally {
        console.log("Disconnecting database...");
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

runMigration();
