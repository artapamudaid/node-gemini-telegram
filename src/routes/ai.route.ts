import { Router } from "express";
import { aiQueue } from "../queue/ai.queue";
import { v4 as uuid } from "uuid";

export const aiRoute = Router();

aiRoute.post("/ask", async (req, res) => {
  const {
    telegram_bot_key,
    telegram_receiver_id,
    gemini_api_key,
    prompt,
    payloads,
  } = req.body;

  const jobId = uuid();

  await aiQueue.add(
    "ask-gemini",
    {
      jobId,
      telegram_bot_key,
      telegram_receiver_id,
      gemini_api_key,
      prompt,
      payloads,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    }
  );

  res.json({
    status: "queued",
    job_id: jobId,
  });
});

