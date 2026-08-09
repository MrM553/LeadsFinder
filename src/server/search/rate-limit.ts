/** Simple in-process throttle: ensures at least `minIntervalMs` between calls. */
export function createThrottle(minIntervalMs: number) {
  let last = 0;
  return async function throttle(): Promise<void> {
    const now = Date.now();
    const wait = last + minIntervalMs - now;
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    last = Date.now();
  };
}
