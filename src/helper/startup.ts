import mongoose from 'mongoose';
import { logger } from './winston-logger';
import { initRedis } from './redis';
import { userModel, businessModel } from '../database';

const migrateBusinesses = async () => {
    try {
        logger.info('🔍 Running startup business data migration...');
        const users = await userModel.find({
            isDeleted: false,
            $or: [
                { 'workDetails.businessDetails.businessName': { $nin: [null, ''] } },
                { 'familyMembers.workDetails.businessDetails.businessName': { $nin: [null, ''] } }
            ]
        });

        if (users.length === 0) {
            logger.info('ℹ️ No users or family members found with business details to migrate.');
            return;
        }

        logger.info(`🔍 Found ${users.length} potential users/family members with business details to migrate.`);
        let migratedCount = 0;

        for (const user of users) {
            // Migrate head user business
            if (user.workDetails && user.workDetails.businessDetails && user.workDetails.businessDetails.businessName) {
                const bd = user.workDetails.businessDetails;
                const exists = await businessModel.findOne({
                    userId: user._id,
                    familyMemberId: null,
                    businessName: bd.businessName
                });

                if (!exists) {
                    await businessModel.create({
                        userId: user._id,
                        familyMemberId: null,
                        category: bd.category || null,
                        subCategory: bd.subCategory || [],
                        businessName: bd.businessName,
                        ownerName: bd.ownerName || null,
                        description: bd.description || null,
                        businessLogo: bd.businessLogo || null,
                        businessBanner: bd.businessBanner || null,
                        businessPhotos: bd.businessPhotos || [],
                        locations: bd.locations || [],
                        contactInfo: bd.contactInfo || {},
                        isActive: true,
                        isDeleted: false
                    });
                    migratedCount++;
                }
            }

            // Migrate family members' businesses
            if (user.familyMembers && user.familyMembers.length > 0) {
                for (const member of user.familyMembers) {
                    if (member.workDetails && member.workDetails.businessDetails && member.workDetails.businessDetails.businessName) {
                        const bd = member.workDetails.businessDetails;
                        const exists = await businessModel.findOne({
                            userId: user._id,
                            familyMemberId: member._id,
                            businessName: bd.businessName
                        });

                        if (!exists) {
                            await businessModel.create({
                                userId: user._id,
                                familyMemberId: member._id,
                                category: bd.category || null,
                                subCategory: bd.subCategory || [],
                                businessName: bd.businessName,
                                ownerName: bd.ownerName || null,
                                description: bd.description || null,
                                businessLogo: bd.businessLogo || null,
                                businessBanner: bd.businessBanner || null,
                                businessPhotos: bd.businessPhotos || [],
                                locations: bd.locations || [],
                                contactInfo: bd.contactInfo || {},
                                isActive: true,
                                isDeleted: false
                            });
                            migratedCount++;
                        }
                    }
                }
            }
        }
        logger.info(`✅ Business migration completed. Migrated ${migratedCount} new business entries to new Business collection.`);
    } catch (err) {
        logger.error(`❌ Error migrating businesses: ${err}`);
    }
};

export const initApp = async () => {
    try {
        logger.info('🚀 Starting application initialization...');
        
        // 1. Ensure DB connection
        if (mongoose.connection.readyState !== 1) {
            const dbUrl = process.env.DB_URL;
            if (!dbUrl) {
                throw new Error('DB_URL is not defined in environment variables');
            }
            await mongoose.connect(dbUrl);
            logger.info('✅ Database connected successfully');
        }

        // 2. Initialize Redis
        await initRedis();

        // 3. Perform any pre-loading or setup tasks here
        await migrateBusinesses();
        
        logger.info('✨ Startup process completed');
        return true;
    } catch (error) {
        logger.error(`❌ Startup failed: ${error}`);
        process.exit(1);
    }
};
