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
  "ai-queue",
  async (job) => {
    const {
      jobId,
      telegram_bot_key,
      telegram_receiver_id,
      gemini_api_key,
      prompt,
      payloads,
      message_thread_id,
    } = job.data;

    console.log(`[AI Worker] Processing job ${jobId}`);

    // ===============================
    // 🔹 REDIS CACHE
    // ===============================
    const cacheKey = `gemini:${Buffer.from(
      prompt + JSON.stringify(payloads)
    ).toString("base64")}`;

    const cached = await redis.get(cacheKey);

    let response: string;

    if (cached) {
        console.log(`[AI Worker] Cache hit for ${jobId}`);
        response = cached;
    } else {
        console.log(`[AI Worker] Cache miss, calling Gemini API for ${jobId}`);
        response = await askGemini(
            gemini_api_key,
            prompt,
            payloads
        );

        await redis.setex(cacheKey, 3600, response);
        console.log(`[AI Worker] Cached response for ${jobId}`);
    }

    if (!response || response.trim().length === 0) {
        throw new Error("Empty AI response");
    }

    const safeText = normalizeText(response);

    const finalText =
      safeText.length > 4000
        ? safeText.slice(0, 4000) + "\n\n...(truncated)"
        : safeText;

    console.log(`[AI Worker] Response length: ${finalText.length} for ${jobId}`);

    // ===============================
    // 🔹 TELEGRAM
    // ===============================
    
    const sentKey = `telegram:sent:${jobId}`;
    if (!(await redis.get(sentKey))) {
      console.log(`[AI Worker] Sending Telegram message for ${jobId}`);
      await sendTelegramMessage(
        telegram_bot_key,
        telegram_receiver_id,
        finalText,
        message_thread_id, 
      );
      await redis.set(sentKey, "1", "EX", 86400);
      console.log(`[AI Worker] Telegram message sent for ${jobId}`);
    } else {
      console.log(`[AI Worker] Skipping Telegram, already sent for ${jobId}`);
    }

    // ===============================
    // 🔹 POSTGRES LOG
    // ===============================
    console.log("[PG CONNECT]", {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });


    try {
      await pg.query(
      `INSERT INTO ai_requests
       (id, telegram_bot_key, telegram_receiver_id, thread_id, prompt, payloads, response)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        jobId,
        telegram_bot_key,
        telegram_receiver_id,
        message_thread_id,
        prompt,
        payloads,
        response,
      ]
      );

      console.log(`[AI Worker] Job ${jobId} completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`[AI Worker] Database error for job ${jobId}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection.connection,
    concurrency: 5,
  }
);
