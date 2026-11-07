import type { ExclusiveLock, ExclusiveOutcome } from "./types";

export const runExclusively = <T>(
  lock: ExclusiveLock,
  waitMs: number,
  work: () => T,
): ExclusiveOutcome<T> => {
  if (!lock.tryLock(waitMs)) {
    return { ran: false };
  }
  try {
    return { ran: true, value: work() };
  } finally {
    lock.releaseLock();
  }
};
