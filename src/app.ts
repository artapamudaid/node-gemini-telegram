import express from "express";
import dotenv from "dotenv";
import { aiRoute } from "./routes/ai.route";
import { sendRoute } from "./routes/send.route";
import { staticKeyAuth } from "./middleware/auth.middleware";
import { rateLimit } from "./middleware/rateLimit.middleware";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(rateLimit);
app.use(staticKeyAuth);

app.use("/api/ai", aiRoute);
app.use("/api/send", sendRoute);
