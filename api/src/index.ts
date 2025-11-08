import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import type { ProjectEnvironment } from "@dm-holdfast/supabase-types";

dotenv.config();

const requiredEnv: Array<keyof ProjectEnvironment> = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.warn(
    `Missing environment variables: ${missingEnv.join(
      ", ",
    )}. Some features may not behave as expected.`,
  );
}

const app = express();
const port = process.env.PORT ?? "4000";

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.SUPABASE_URL ?? null,
  });
});

app.listen(Number(port), () => {
  console.log(`API server running on http://localhost:${port}`);
});

