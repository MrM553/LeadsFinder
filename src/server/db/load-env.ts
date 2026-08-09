import { existsSync } from "node:fs";

// CLI scripts run via tsx (migrate/seed) aren't loaded by Next.js, so they
// don't get its automatic .env.local loading — do it ourselves.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
