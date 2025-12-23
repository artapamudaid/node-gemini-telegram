import { Request, Response, NextFunction } from "express";

export function staticKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.headers["x-secret-key"];

  if (key !== process.env.STATIC_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
