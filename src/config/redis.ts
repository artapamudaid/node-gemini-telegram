import dotenv from "dotenv";
dotenv.config();

import { Redis } from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASS || undefined, 
  maxRetriesPerRequest: null,
});

export const redisConnection = {
  connection: redis,
};
