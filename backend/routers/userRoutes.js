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

const router = express.Router();

// Cache management routes
router.delete("/cache/clear", clearUserCache);
router.get("/cache/stats", getCacheStats);
// User CRUD routes
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Database seeding route
router.post("/seed", seedDatabase);

export default router;