import { describe, expect, it } from "vitest";
import { runExclusively } from "./runExclusively";
import type { ExclusiveLock } from "./types";

class InMemoryLock implements ExclusiveLock {
  held = false;
  waits: number[] = [];

  tryLock(timeoutMs: number): boolean {
    this.waits.push(timeoutMs);
    if (this.held) {
      return false;
    }
    this.held = true;
    return true;
  }

  releaseLock(): void {
    this.held = false;
  }
}

describe("runExclusively", () => {
  it("Runs the work and returns its result when the lock is free", () => {
    const lock = new InMemoryLock();

    expect(runExclusively(lock, 0, () => "done")).toEqual({ ran: true, value: "done" });
  });

  it("Holds the lock while the work runs", () => {
    const lock = new InMemoryLock();
    let heldDuringWork = false;

    runExclusively(lock, 0, () => {
      heldDuringWork = lock.held;
    });

    expect(heldDuringWork).toBe(true);
  });

  it("Releases the lock after the work finishes", () => {
    const lock = new InMemoryLock();

    runExclusively(lock, 0, () => undefined);

    expect(lock.held).toBe(false);
  });

  it("Releases the lock when the work throws", () => {
    const lock = new InMemoryLock();

    expect(() =>
      runExclusively(lock, 0, () => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(lock.held).toBe(false);
  });

  it("Skips the work when another run holds the lock", () => {
    const lock = new InMemoryLock();
    lock.held = true;
    let worked = false;

    const outcome = runExclusively(lock, 0, () => {
      worked = true;
    });

    expect(outcome).toEqual({ ran: false });
    expect(worked).toBe(false);
  });

  it("Leaves a lock held by another run untouched when skipping", () => {
    const lock = new InMemoryLock();
    lock.held = true;

    runExclusively(lock, 0, () => undefined);

    expect(lock.held).toBe(true);
  });

  it("Does not let two overlapping runs both do the work", () => {
    const lock = new InMemoryLock();
    let inner: ReturnType<typeof runExclusively<string>> | undefined;

    runExclusively(lock, 0, () => {
      inner = runExclusively(lock, 0, () => "second");
    });

    expect(inner).toEqual({ ran: false });
  });

  it("Waits up to the given time for the lock", () => {
    const lock = new InMemoryLock();

    runExclusively(lock, 30000, () => undefined);

    expect(lock.waits).toEqual([30000]);
  });
});
