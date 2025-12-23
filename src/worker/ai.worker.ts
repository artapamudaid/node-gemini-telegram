import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { redis } from "../config/redis";
import { askGemini } from "../services/gemini.service";
import { sendTelegramMessage } from "../services/telegram.service";
import { pg } from "../config/postgres";

new Worker(
  "ai-queue",
  async (job) => {
    const {
      jobId,
      telegram_bot_key,
      telegram_receiver_id,
      gemini_api_key,
      prompt,
      payloads,
    } = job.data;

    // ===============================
    // 🔹 REDIS CACHE (DI SINI)
    // ===============================
    const cacheKey = `gemini:${Buffer.from(
      prompt + JSON.stringify(payloads)
    ).toString("base64")}`;

    const cached = await redis.get(cacheKey);

    let response: string;

    if (cached) {
        response = cached;
    } else {
        response = await askGemini(
            gemini_api_key,
            prompt,
            payloads
        );

        await redis.setex(cacheKey, 3600, response);
    }

    if (!response || response.trim().length === 0) {
        throw new Error("Empty AI response");
    }

    // ===============================
    // 🔹 TELEGRAM
    // ===============================
    await sendTelegramMessage(
      telegram_bot_key,
      telegram_receiver_id,
      response
    );

    // ===============================
    // 🔹 POSTGRES LOG
    // ===============================
    await pg.query(
      `INSERT INTO ai_requests
       (id, telegram_bot_key, telegram_receiver_id, prompt, payloads, response)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        jobId,
        telegram_bot_key,
        telegram_receiver_id,
        prompt,
        payloads,
        response,
      ]
    );

    return { success: true };
  },
  {
    connection: redisConnection.connection,
    concurrency: 5,
  }
);
