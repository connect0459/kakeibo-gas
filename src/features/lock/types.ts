export interface ExclusiveLock {
  tryLock(timeoutMs: number): boolean;
  releaseLock(): void;
}

export type ExclusiveOutcome<T> = { ran: true; value: T } | { ran: false };
