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
import { 
    readRateLimit, 
    strictRateLimit, 
    adminRateLimit 
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Cache management routes (admin)
router.delete("/cache/clear", adminRateLimit, clearUserCache);
router.get("/cache/stats", adminRateLimit, getCacheStats);

// User CRUD routes
router.get("/", readRateLimit, getUsers);                    // Paginated, filtered, sorted
router.get("/:id", readRateLimit, getUserById);
router.post("/", strictRateLimit, createUser);
router.put("/:id", strictRateLimit, updateUser);
router.delete("/:id", strictRateLimit, deleteUser);

// Database seeding route (admin)
router.post("/seed", adminRateLimit, seedDatabase);

export default router;