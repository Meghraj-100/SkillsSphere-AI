import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config({ override: true });

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

let hasLoggedError = false;

redisClient.on("error", (err) => {
  if (!hasLoggedError) {
    console.log("Redis unavailable. Continuing without Redis.");
    hasLoggedError = true;
  }
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
  hasLoggedError = false;
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.log("Redis connection skipped for local development");
  }
};

export default redisClient;
