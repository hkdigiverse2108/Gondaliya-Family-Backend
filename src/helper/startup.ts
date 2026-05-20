import mongoose from 'mongoose';
import { logger } from './winston-logger';
import { initRedis } from './redis';

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
        
        logger.info('✨ Startup process completed');
        return true;
    } catch (error) {
        logger.error(`❌ Startup failed: ${error}`);
        process.exit(1);
    }
};
