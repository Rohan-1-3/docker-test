import { PrismaClient } from "@prisma/client";
import redisClient from "../services/redisService.js";

const prisma = new PrismaClient();

// Get all users with pagination, filtering, and sorting
export const getUsers = async (req, res) => {
    try {
        const startTime = performance.now();
        
        // Extract query parameters
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            isActive,
            city,
            state,
            country,
            occupation,
            company
        } = req.query;

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
        const skip = (pageNum - 1) * limitNum;

        // Validate sort parameters
        const validSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt', 'city', 'state', 'occupation', 'company'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

        // Build filter conditions
        const where = {};
        
        // Search across multiple fields
        if (search && search.trim() !== '') {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { occupation: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Apply filters
        if (isActive !== undefined && isActive.trim() !== '') {
            where.isActive = isActive === 'true';
        }
        if (city && city.trim() !== '') {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (state && state.trim() !== '') {
            where.state = { contains: state, mode: 'insensitive' };
        }
        if (country && country.trim() !== '') {
            where.country = { contains: country, mode: 'insensitive' };
        }
        if (occupation && occupation.trim() !== '') {
            where.occupation = { contains: occupation, mode: 'insensitive' };
        }
        if (company && company.trim() !== '') {
            where.company = { contains: company, mode: 'insensitive' };
        }

        // Create cache key based on query parameters
        const queryHash = Buffer.from(JSON.stringify({ where, sortField, sortDirection, skip, limitNum })).toString('base64');
        const cacheKey = `users:query:${queryHash}`;
        
        // Try to get from cache first
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            const endTime = performance.now();
            console.log(`📦 Users query fetched from cache in ${(endTime - startTime).toFixed(2)}ms`);
            
            return res.status(200).json({
                ...JSON.parse(cachedResult),
                source: "cache",
                responseTime: `${(endTime - startTime).toFixed(2)}ms`
            });
        }

        // Get total count for pagination
        const totalUsers = await prisma.user.count({ where });

        // Get paginated users
        const users = await prisma.user.findMany({
            where,
            orderBy: {
                [sortField]: sortDirection
            },
            skip,
            take: limitNum
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalUsers / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const result = {
            success: true,
            data: users,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalUsers,
                usersPerPage: limitNum,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? pageNum + 1 : null,
                prevPage: hasPrevPage ? pageNum - 1 : null
            },
            filters: {
                search,
                isActive,
                city,
                state,
                country,
                occupation,
                company
            },
            sorting: {
                sortBy: sortField,
                sortOrder: sortDirection
            },
            source: "database"
        };

        // Cache the result for 2 minutes (shorter TTL for queries)
        await redisClient.setEx(cacheKey, 120, JSON.stringify(result));
        
        const endTime = performance.now();
        console.log(`🗄️ Users query fetched from database in ${(endTime - startTime).toFixed(2)}ms`);

        res.status(200).json({
            ...result,
            responseTime: `${(endTime - startTime).toFixed(2)}ms`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message
        });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const startTime = performance.now();
        const cacheKey = `user:${id}`;
        
        // Try to get from cache first
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
            const endTime = performance.now();
            console.log(`📦 User ${id} fetched from cache in ${(endTime - startTime).toFixed(2)}ms`);
            
            return res.status(200).json({
                success: true,
                data: JSON.parse(cachedUser),
                source: "cache",
                responseTime: `${(endTime - startTime).toFixed(2)}ms`
            });
        }

        // If not in cache, fetch from database
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Cache the user for 10 minutes
        await redisClient.setEx(cacheKey, 600, JSON.stringify(user));
        
        const endTime = performance.now();
        console.log(`🗄️ User ${id} fetched from database in ${(endTime - startTime).toFixed(2)}ms`);

        res.status(200).json({
            success: true,
            data: user,
            source: "database",
            responseTime: `${(endTime - startTime).toFixed(2)}ms`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user",
            error: error.message
        });
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
        const { 
            firstName, 
            middleName, 
            lastName, 
            email, 
            phone, 
            dob,
            address,
            city,
            state,
            zipCode,
            country,
            occupation,
            company,
            website,
            bio,
            isActive
        } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, and email are required"
            });
        }

        const userData = {
            firstName,
            lastName,
            email,
            ...(middleName && { middleName }),
            ...(phone && { phone }),
            ...(dob && { dob: new Date(dob) }),
            ...(address && { address }),
            ...(city && { city }),
            ...(state && { state }),
            ...(zipCode && { zipCode }),
            ...(country && { country }),
            ...(occupation && { occupation }),
            ...(company && { company }),
            ...(website && { website }),
            ...(bio && { bio }),
            ...(isActive !== undefined && { isActive: Boolean(isActive) })
        };

        const user = await prisma.user.create({
            data: userData
        });

        // Invalidate cache after creating user
        await redisClient.del("users:all");
        // Clear all query caches
        const queryKeys = await redisClient.keys("users:query:*");
        if (queryKeys.length > 0) {
            await redisClient.del(queryKeys);
        }
        console.log("🗑️ Cache invalidated after user creation");

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message
        });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            firstName, 
            middleName, 
            lastName, 
            email, 
            phone, 
            dob,
            address,
            city,
            state,
            zipCode,
            country,
            occupation,
            company,
            website,
            bio,
            isActive
        } = req.body;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (dob) updateData.dob = new Date(dob);
        if (address) updateData.address = address;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (zipCode) updateData.zipCode = zipCode;
        if (country) updateData.country = country;
        if (occupation) updateData.occupation = occupation;
        if (company) updateData.company = company;
        if (website) updateData.website = website;
        if (bio) updateData.bio = bio;
        if (middleName !== undefined) updateData.middleName = middleName;
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        // Invalidate cache after updating user
        await redisClient.del(`user:${id}`);
        await redisClient.del("users:all");
        // Clear all query caches
        const queryKeys = await redisClient.keys("users:query:*");
        if (queryKeys.length > 0) {
            await redisClient.del(queryKeys);
        }
        console.log(`🗑️ Cache invalidated after updating user ${id}`);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        res.status(500).json({
            success: false,
            message: "Error updating user",
            error: error.message
        });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Delete user
        await prisma.user.delete({
            where: { id }
        });

        // Invalidate cache after deleting user
        await redisClient.del(`user:${id}`);
        await redisClient.del("users:all");
        // Clear all query caches
        const queryKeys = await redisClient.keys("users:query:*");
        if (queryKeys.length > 0) {
            await redisClient.del(queryKeys);
        }
        console.log(`🗑️ Cache invalidated after deleting user ${id}`);

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error.message
        });
    }
};

// Clear all user cache
export const clearUserCache = async (req, res) => {
    try {
        const keys = await redisClient.keys("user:*");
        const queryKeys = await redisClient.keys("users:query:*");
        const allUsersKey = "users:all";
        
        const keysToDelete = [...keys, ...queryKeys, allUsersKey];
        
        if (keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
        }
        
        res.status(200).json({
            success: true,
            message: `Cache cleared successfully. Deleted ${keysToDelete.length} keys.`,
            deletedKeys: {
                userKeys: keys.length,
                queryKeys: queryKeys.length,
                allUsersKey: 1,
                total: keysToDelete.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error clearing cache",
            error: error.message
        });
    }
};

// Get cache statistics
export const getCacheStats = async (req, res) => {
    try {
        const userKeys = await redisClient.keys("user:*");
        const allUsersExists = await redisClient.exists("users:all");
        
        const stats = {
            totalUserCacheKeys: userKeys.length,
            allUsersCached: allUsersExists === 1,
            userCacheKeys: userKeys,
            cacheInfo: await redisClient.info("memory")
        };
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting cache stats",
            error: error.message
        });
    }
};

// Seed database with sample data
export const seedDatabase = async (req, res) => {
    try {
        const { default: seedFunction } = await import("../scripts/seedDatabase.js");
        const createdUsers = await seedFunction();
        
        res.status(200).json({
            success: true,
            message: "Database seeded successfully",
            data: {
                usersCreated: createdUsers.length,
                users: createdUsers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error seeding database",
            error: error.message
        });
    }
};