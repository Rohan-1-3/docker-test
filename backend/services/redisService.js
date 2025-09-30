import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis-dev:6379'
});

redisClient.on("error", (err) => {
    console.error("🔴 Redis Client Error:", err);
});

redisClient.on("connect", () => {
    console.log("🟡 Redis Client is connecting...");
});

redisClient.on("ready", () => {
    console.log("🟢 Redis Client is ready!");
});

redisClient.on("end", () => {
    console.log("🔴 Redis Client connection ended");
});

// Wrap the connection in an async function
async function connectRedis() {
    try {
        await redisClient.connect();
        console.log("✅ Connected to Redis successfully");
        
        // Test the connection
        await redisClient.ping();
        console.log("✅ Redis ping successful");
        
    } catch (error) {
        console.error("❌ Failed to connect to Redis:", error);
        process.exit(1); // Exit if Redis is critical
    }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
    console.log('🛑 Closing Redis connection...');
    await redisClient.quit();
});

// Call the connection function
connectRedis();

export default redisClient;