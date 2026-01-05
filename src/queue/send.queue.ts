import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const sendQueue = new Queue("send-queue", {
  connection: redisConnection.connection,
});
