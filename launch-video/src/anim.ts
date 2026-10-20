import { Easing, interpolate, spring, useVideoConfig, type SpringConfig } from "remotion";

/** A bouncy 0 to 1 (with overshoot) that starts at `start`. Zero before that. */
export function usePop(frame: number, start: number, config: Partial<SpringConfig> = {}): number {
  const { fps } = useVideoConfig();
  if (frame < start) return 0;
  return spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 170, mass: 0.7, ...config } });
}

export const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

/** A smooth 0 to 1 over `duration` frames from `start`. */
export function progress(frame: number, start: number, duration = 14): number {
  return interpolate(frame, [start, start + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/** Counts from `from` to `to` between two frames. */
export function count(frame: number, start: number, end: number, from: number, to: number): number {
  return Math.round(interpolate(frame, [start, end], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
}

/** Layout facts every scene needs. Everything is designed on a 1080 pixel base, so both formats share one scale. */
export function useLayout() {
  const { width, height } = useVideoConfig();
  return { width, height, portrait: height > width };
}
