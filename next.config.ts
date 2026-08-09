import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

// Enables Cloudflare bindings/context to work under `next dev` (not just
// `wrangler dev`). No-op in the actual Workers runtime.
initOpenNextCloudflareForDev();

export default nextConfig;
