import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const aiQueue = new Queue("ai-queue", {
  connection: redisConnection.connection,
});
