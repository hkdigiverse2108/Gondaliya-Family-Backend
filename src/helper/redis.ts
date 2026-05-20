import Redis from 'ioredis';
import { logger } from './winston-logger';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

class RedisFallback {
    private store = new Map<string, { value: string; expiry?: number }>();

    async get(key: string): Promise<string | null> {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
        let expiry: number | undefined;
        if (args[0] === 'EX' && typeof args[1] === 'number') {
            expiry = Date.now() + args[1] * 1000;
        }
        this.store.set(key, { value, expiry });
        return 'OK';
    }

    async del(key: string): Promise<number> {
        return this.store.delete(key) ? 1 : 0;
    }

    async mget(keys: string[]): Promise<(string | null)[]> {
        return Promise.all(keys.map(key => this.get(key)));
    }

    pipeline() {
        const commands: (() => Promise<any>)[] = [];
        return {
            set: (key: string, value: string, ...args: any[]) => {
                commands.push(() => this.set(key, value, ...args));
                return this;
            },
            exec: async () => {
                const results = await Promise.all(commands.map(cmd => cmd()));
                return results.map(res => [null, res]);
            }
        };
    }

    on(event: string, callback: (...args: any[]) => void) {
        // Mock event listener
        if (event === 'connect') {
            setTimeout(callback, 0);
        }
    }
}

let redis: Redis | RedisFallback;
let isFallback = false;

export const initRedis = async () => {
    try {
        const client = new Redis(redisUrl, {
            retryStrategy: (times) => {
                if (times > 3) {
                    logger.warn('⚠️ Redis connection failed multiple times. Switching to In-Memory Fallback.');
                    isFallback = true;
                    redis = new RedisFallback();
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 2000);
            },
            maxRetriesPerRequest: 1,
            connectTimeout: 5000,
        });

        client.on('connect', () => {
            isFallback = false;
            logger.info('✅ Redis connected successfully');
        });

        client.on('error', (err) => {
            if (!isFallback) {
                logger.warn(`⏳ Redis connection attempt failed: ${err.message}. Retrying...`);
            }
        });

        redis = client;
        return redis;
    } catch (error) {
        logger.warn('⚠️ Failed to initialize Redis client. Using In-Memory Fallback.');
        redis = new RedisFallback();
        isFallback = true;
        return redis;
    }
};

export const getRedis = () => {
    if (!redis) {
        throw new Error('Redis not initialized. Call initRedis first.');
    }
    return redis;
};

/**
 * Fast Data Load into Redis using Pipelining
 */
export const fastRedisLoad = async (data: Record<string, any>, ttlSeconds?: number) => {
    const pipe = redis.pipeline();
    
    Object.entries(data).forEach(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            pipe.set(key, stringValue, 'EX', ttlSeconds);
        } else {
            pipe.set(key, stringValue);
        }
    });

    return await pipe.exec();
};

/**
 * Fast Multi-Get from Redis
 */
export const fastRedisGet = async (keys: string[]) => {
    return await redis.mget(keys);
};

/**
 * Basic Redis Get
 */
export const redisGet = async (key: string) => {
    return await redis.get(key);
};

/**
 * Basic Redis Set
 */
export const redisSet = async (key: string, value: string, ttlSeconds?: number) => {
    if (ttlSeconds) {
        return await redis.set(key, value, 'EX', ttlSeconds);
    }
    return await redis.set(key, value);
};

/**
 * Basic Redis Delete
 */
export const redisDel = async (key: string) => {
    return await redis.del(key);
};

/**
 * Delete keys by pattern
 */
export const redisDelPattern = async (pattern: string) => {
    if (isFallback) {
        // Fallback implementation for In-Memory store
        let count = 0;
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of (redis as any).store.keys()) {
            if (regex.test(key)) {
                (redis as any).store.delete(key);
                count++;
            }
        }
        return count;
    }

    const client = redis as Redis;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
        return await client.del(...keys);
    }
    return 0;
};

