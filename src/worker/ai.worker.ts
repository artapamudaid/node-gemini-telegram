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

    const safeText = normalizeText(response);

    // potong kalau terlalu panjang
    const finalText =
      safeText.length > 4000
        ? safeText.slice(0, 4000) + "\n\n...(truncated)"
        : safeText;


    // ===============================
    // 🔹 TELEGRAM
    // ===============================
    
    const sentKey = `telegram:sent:${jobId}`;
    if (!(await redis.get(sentKey))) {
      await sendTelegramMessage(
        telegram_bot_key,
        telegram_receiver_id,
        finalText
      );
      await redis.set(sentKey, "1", "EX", 86400);
    }

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
