export const EASE = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t: number) => t,
  back: (t: number) => {
    const c = 1.7;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type TweenOptions = { ease?: (t: number) => number; delay?: number };

// Every scripted animation goes through here so "reduce motion" is honoured
// in one place: the final frame is applied immediately and nothing is animated.
export function tween(
  duration: number,
  onFrame: (progress: number) => void,
  { ease = EASE.out, delay = 0 }: TweenOptions = {},
): { done: Promise<void>; cancel: () => void } {
  let frame = 0;
  let cancelled = false;
  const done = new Promise<void>((resolve) => {
    if (prefersReducedMotion()) {
      onFrame(1);
      resolve();
      return;
    }
    let start: number | null = null;
    const step = (now: number) => {
      if (cancelled) {
        resolve();
        return;
      }
      if (start === null) start = now + delay;
      const raw = Math.min(1, Math.max(0, (now - start) / duration));
      onFrame(ease(raw));
      if (now - start < duration) {
        frame = requestAnimationFrame(step);
      } else {
        onFrame(1);
        resolve();
      }
    };
    frame = requestAnimationFrame(step);
  });
  return {
    done,
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    },
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : ms));
}
