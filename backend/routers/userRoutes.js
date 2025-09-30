import express from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    clearUserCache,
    getCacheStats,
    seedDatabase
} from "../controllers/userController.js";
import { readRateLimiter, writeRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Cache management routes (admin)
router.delete("/cache/clear", writeRateLimiter, clearUserCache);
router.get("/cache/stats", readRateLimiter, getCacheStats);

// User CRUD routes
router.get("/", readRateLimiter, getUsers);                    // Paginated, filtered, sorted
router.get("/:id", readRateLimiter, getUserById);
router.post("/", writeRateLimiter, createUser);
router.put("/:id", writeRateLimiter, updateUser);
router.delete("/:id", writeRateLimiter, deleteUser);

// Database seeding route (admin)
router.post("/seed", writeRateLimiter, seedDatabase);

export default router;