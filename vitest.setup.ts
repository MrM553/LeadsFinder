import { existsSync } from "node:fs";

// Vitest doesn't auto-load .env.local the way Next.js does.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
