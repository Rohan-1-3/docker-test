import rateLimit from "express-rate-limit";
import redisClient from "../services/redisService.js";

// Redis store for rate limiting (optional - falls back to memory)
class RedisStore {
    constructor(client) {
        this.client = client;
        this.prefix = "rate_limit:";
    }

    async get(key) {
        try {
            const result = await this.client.get(this.prefix + key);
            return result ? parseInt(result, 10) : 0;
        } catch (error) {
            console.error("Rate limit store get error:", error);
            return 0;
        }
    }

    async set(key, value, windowMs) {
        try {
            await this.client.setEx(this.prefix + key, Math.ceil(windowMs / 1000), value.toString());
        } catch (error) {
            console.error("Rate limit store set error:", error);
        }
    }

    async increment(key, windowMs) {
        try {
            const current = await this.get(key);
            const newValue = current + 1;
            await this.set(key, newValue, windowMs);
            return { totalHits: newValue, resetTime: new Date(Date.now() + windowMs) };
        } catch (error) {
            console.error("Rate limit store increment error:", error);
            return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
        }
    }

    async decrement(key) {
        try {
            const current = await this.get(key);
            if (current > 0) {
                await this.set(key, current - 1, 60000); // 1 minute default
            }
        } catch (error) {
            console.error("Rate limit store decrement error:", error);
        }
    }

    async resetKey(key) {
        try {
            await this.client.del(this.prefix + key);
        } catch (error) {
            console.error("Rate limit store reset error:", error);
        }
    }
}

// Create Redis store instance
const redisStore = new RedisStore(redisClient);

// General rate limiter
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
        retryAfter: "15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: redisStore, // Use Redis store
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests from this IP, please try again later.",
            retryAfter: "15 minutes",
            limit: 100,
            windowMs: 15 * 60 * 1000
        });
    }
});

// Strict rate limiter for write operations
export const strictRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for write operations
    message: {
        success: false,
        message: "Too many write requests from this IP, please try again later.",
        retryAfter: "5 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => {
        return `write:${req.ip || req.connection.remoteAddress}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many write requests from this IP, please try again later.",
            retryAfter: "5 minutes",
            limit: 10,
            windowMs: 5 * 60 * 1000
        });
    }
});

// Lenient rate limiter for read operations
export const readRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 requests per minute for read operations
    message: {
        success: false,
        message: "Too many read requests from this IP, please try again later.",
        retryAfter: "1 minute"
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => {
        return `read:${req.ip || req.connection.remoteAddress}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many read requests from this IP, please try again later.",
            retryAfter: "1 minute",
            limit: 60,
            windowMs: 1 * 60 * 1000
        });
    }
});

// Admin rate limiter (more permissive)
export const adminRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 admin requests per minute
    message: {
        success: false,
        message: "Too many admin requests from this IP, please try again later.",
        retryAfter: "1 minute"
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => {
        return `admin:${req.ip || req.connection.remoteAddress}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many admin requests from this IP, please try again later.",
            retryAfter: "1 minute",
            limit: 20,
            windowMs: 1 * 60 * 1000
        });
    }
});

export default {
    generalRateLimit,
    strictRateLimit,
    readRateLimit,
    adminRateLimit
};