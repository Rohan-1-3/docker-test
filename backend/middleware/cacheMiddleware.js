import redisClient from "../services/redisService.js";

// Middleware to handle Redis connection errors gracefully
export const handleRedisError = (error, fallbackFunction) => {
    console.error("Redis operation failed:", error);
    console.log("Falling back to database operation");
    return fallbackFunction;
};

// Cache wrapper function
export const withCache = (cacheKey, ttl = 300) => {
    return (target, propertyName, descriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args) {
            try {
                // Try to get from cache
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log(`📦 Cache hit for key: ${cacheKey}`);
                    return JSON.parse(cachedData);
                }
            } catch (error) {
                console.error("Cache read error:", error);
            }

            // Execute original method
            const result = await originalMethod.apply(this, args);

            try {
                // Cache the result
                await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
                console.log(`💾 Data cached for key: ${cacheKey}`);
            } catch (error) {
                console.error("Cache write error:", error);
            }

            return result;
        };

        return descriptor;
    };
};

// Cache invalidation helper
export const invalidateCache = async (patterns) => {
    try {
        for (const pattern of patterns) {
            if (pattern.includes('*')) {
                const keys = await redisClient.keys(pattern);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                    console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
                }
            } else {
                await redisClient.del(pattern);
                console.log(`🗑️ Invalidated cache key: ${pattern}`);
            }
        }
    } catch (error) {
        console.error("Cache invalidation error:", error);
    }
};

// Health check for Redis
export const checkRedisHealth = async () => {
    try {
        const pong = await redisClient.ping();
        return { status: 'healthy', response: pong };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
};