import dotenv from "dotenv";
dotenv.config(); 

import { Pool } from "pg";

export const pg = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: String(process.env.DATABASE_PASSWORD), 
  database: process.env.DATABASE_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  options: '-c search_path=public'
});
