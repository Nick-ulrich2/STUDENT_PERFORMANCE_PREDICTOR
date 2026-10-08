// Tracks API requests that are taking suspiciously long. The free hosting tier
// puts the API to sleep after ~15 minutes; the first request then takes 30-60 s.
// The overlay subscribes here so the wait is explained instead of looking frozen.
const SLOW_AFTER_MS = 3500;

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
