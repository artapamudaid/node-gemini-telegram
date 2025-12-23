import { redis } from "../config/redis";
import { Request, Response, NextFunction } from "express";

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip;
  const key = `rate:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }

  if (count > 30) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  next();
}
