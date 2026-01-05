import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { redis } from "../config/redis";
import { askGemini } from "../services/gemini.service";
import { sendTelegramMessage } from "../services/telegram.service";
import { pg } from "../config/postgres";

function normalizeText(input: any): string {
  if (!input) return "⚠️ Empty response";

  if (typeof input === "string") return input;

  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}


new Worker(
  "send-queue",
  async (job) => {
    const {
      jobId,
      telegram_bot_key,
      telegram_receiver_id,
      text,
      message_thread_id,
    } = job.data;

    console.log(`[Send Worker] Processing job ${jobId}`);

    // ===============================
    // 🔹 REDIS CACHE
    // ===============================
    const cacheKey = `message:${Buffer.from(
      JSON.stringify(text)
    ).toString("base64")}`;

    const cached = await redis.get(cacheKey);

    let response: string;

    if (cached) {
        response = cached;
    } else {
        response = text;

        await redis.setex(cacheKey, 3600, response);
    }

    if (!response || response.trim().length === 0) {
        throw new Error("Empty Text");
    }

    const safeText = normalizeText(response);

    const finalText =
      safeText.length > 4000
        ? safeText.slice(0, 4000) + "\n\n...(truncated)"
        : safeText;

    console.log(`[Send Worker] Response length: ${finalText.length} for ${jobId}`);

    // ===============================
    // 🔹 TELEGRAM
    // ===============================
    
    const sentKey = `telegram:sent:${jobId}`;
    if (!(await redis.get(sentKey))) {
      console.log(`[Send Worker] Sending Telegram message for ${jobId}`);
      await sendTelegramMessage(
        telegram_bot_key,
        telegram_receiver_id,
        finalText,
        message_thread_id, 
      );
      await redis.set(sentKey, "1", "EX", 86400);
      console.log(`[Send Worker] Telegram message sent for ${jobId}`);
    } else {
      console.log(`[Send Worker] Skipping Telegram, already sent for ${jobId}`);
    }

    // ===============================
    // 🔹 POSTGRES LOG
    // ===============================


    try {
      await pg.query(
      `INSERT INTO send_requests
       (id, telegram_bot_key, telegram_receiver_id, thread_id, text)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        jobId,
        telegram_bot_key,
        telegram_receiver_id,
        message_thread_id,
        text,
      ]
      );

      console.log(`[Send Worker] Job ${jobId} completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`[Send Worker] Database error for job ${jobId}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection.connection,
    concurrency: 5,
  }
);
