import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("data/leadfinder.db"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  DASHBOARD_USERNAME: z.string().min(1),
  DASHBOARD_PASSWORD_HASH: z.string().min(1),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  DASHBOARD_USERNAME: process.env.DASHBOARD_USERNAME,
  DASHBOARD_PASSWORD_HASH: process.env.DASHBOARD_PASSWORD_HASH,
});
