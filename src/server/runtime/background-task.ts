import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Runs a promise in the background without holding up the response.
 * On Cloudflare Workers, execution is torn down once the response is sent
 * unless explicitly extended via `ctx.waitUntil()` — this does that when
 * running in a Worker, and just fires-and-forgets otherwise (`next dev` /
 * Node.js hosting, where the process stays alive on its own).
 */
export function runInBackground(task: Promise<void>): void {
  try {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(task.catch((err) => console.error("Background task failed:", err)));
  } catch {
    void task.catch((err) => console.error("Background task failed:", err));
  }
}
