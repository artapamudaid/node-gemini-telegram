import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // 🔥 WAJIB UNTUK BULLMQ
});

export const redisConnection = {
  connection: redis,
};
