export const isWithinThrottleWindow = (
  lastRunAt: string | null,
  nowMs: number,
  windowMs: number,
): boolean => {
  if (lastRunAt === null) {
    return false;
  }
  const lastRunMs = Number.parseInt(lastRunAt, 10);
  return Number.isFinite(lastRunMs) && nowMs - lastRunMs < windowMs;
};
