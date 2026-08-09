import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("data/leadfinder.db"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  DASHBOARD_USERNAME: z.string().min(1),
  DASHBOARD_PASSWORD_HASH: z.string().min(1),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Parsed lazily, on first call, not at module load. Cloudflare's build step
 * evaluates route modules to collect page data, but Worker secrets (set via
 * `wrangler secret put`) are only injected once the Worker is actually
 * handling a request — an eager top-level `parse()` here crashed the build
 * for every route that (even transitively) imported this module.
 */
export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DASHBOARD_USERNAME: process.env.DASHBOARD_USERNAME,
    DASHBOARD_PASSWORD_HASH: process.env.DASHBOARD_PASSWORD_HASH,
  });
  return cached;
}
