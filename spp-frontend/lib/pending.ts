// Tracks API requests that are taking suspiciously long. The free hosting tier
// puts the API to sleep after ~15 minutes; the first request then takes 30-60 s.
// The overlay subscribes here so the wait is explained instead of looking frozen.
// Normal calls take 1-4 s on the free tier (more when several run at once), so the
// "server is waking up" screen only appears after 12 s: a real cold start lasts
// 30-60 s. A lower value made it flash on ordinary requests.
const SLOW_AFTER_MS = 12_000;

let slowCount = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function trackRequest(): () => void {
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    slowCount += 1;
    emit();
  }, SLOW_AFTER_MS);
  return () => {
    clearTimeout(timer);
    if (slow) {
      slowCount -= 1;
      emit();
    }
  };
}

export function subscribeSlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasSlowRequest(): boolean {
  return slowCount > 0;
}
