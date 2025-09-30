import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import redisClient from "./services/redisService.js";
import apiRoutes from "./routers/index.js";
import { generalRateLimiter } from "./middleware/rateLimitMiddleware.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

const app = express();

// Rate limiting (applied to all routes)
app.use(generalRateLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/v1", apiRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to User Management API",
        version: "1.0.0",
        endpoints: {
            health: "/api/v1/health",
            users: "/api/v1/users",
            documentation: "Check README.md for full API documentation"
        }
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api/v1/health`);
});