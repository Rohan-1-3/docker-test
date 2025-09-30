import express from "express";
import userRoutes from "./userRoutes.js";
import { checkRedisHealth } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// API v1 routes
router.use("/users", userRoutes);

// Health check endpoint
router.get("/health", async (req, res) => {
    const redisHealth = await checkRedisHealth();
    
    res.status(200).json({
        success: true,
        message: "API v1 is running",
        timestamp: new Date().toISOString(),
        services: {
            api: "healthy",
            redis: redisHealth,
            database: "healthy" // Could add Prisma health check here
        }
    });
});

export default router;