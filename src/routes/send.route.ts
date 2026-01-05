import { Router } from "express";
import { sendQueue } from "../queue/send.queue";
import { v4 as uuid } from "uuid";

export const sendRoute = Router();

sendRoute.post("/message", async (req, res) => {
  const {
    telegram_bot_key,
    telegram_receiver_id,
    text,
    message_thread_id // optional
  } = req.body;

  const jobId = uuid();

  await sendQueue.add(
    "send-message",
    {
      jobId,
      telegram_bot_key,
      telegram_receiver_id,
      text,
      message_thread_id // optional
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

