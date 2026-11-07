import type { ExclusiveLock, ExclusiveOutcome } from "./types";

const heldLocks = new WeakSet<ExclusiveLock>();

export const runExclusively = <T>(
  lock: ExclusiveLock,
  waitMs: number,
  work: () => T,
): ExclusiveOutcome<T> => {
  if (heldLocks.has(lock)) {
    return { ran: true, value: work() };
  }
  if (!lock.tryLock(waitMs)) {
    return { ran: false };
  }
  heldLocks.add(lock);
  try {
    return { ran: true, value: work() };
  } finally {
    heldLocks.delete(lock);
    lock.releaseLock();
  }
};
