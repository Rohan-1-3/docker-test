import rateLimit from "express-rate-limit";

// General rate limiter
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
});

// Read operations (GET)
export const readRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
});

// Write operations (POST, PUT, DELETE)
export const writeRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
});