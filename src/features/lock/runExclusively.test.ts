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

  it("Does not let a run on another holder of the lock do the work", () => {
    const lock = new InMemoryLock();
    const otherHolder = new InMemoryLock();
    otherHolder.held = true;
    let inner: ReturnType<typeof runExclusively<string>> | undefined;

    runExclusively(lock, 0, () => {
      inner = runExclusively(otherHolder, 0, () => "second");
    });

    expect(inner).toEqual({ ran: false });
  });

  it("Runs nested work on the same lock without waiting for itself", () => {
    const lock = new InMemoryLock();
    let inner: ReturnType<typeof runExclusively<string>> | undefined;

    runExclusively(lock, 30000, () => {
      inner = runExclusively(lock, 30000, () => "nested");
    });

    expect(inner).toEqual({ ran: true, value: "nested" });
    expect(lock.waits).toEqual([30000]);
  });

  it("Keeps the lock held until the outer work finishes", () => {
    const lock = new InMemoryLock();
    let heldAfterNested = false;

    runExclusively(lock, 0, () => {
      runExclusively(lock, 0, () => undefined);
      heldAfterNested = lock.held;
    });

    expect(heldAfterNested).toBe(true);
    expect(lock.held).toBe(false);
  });

  it("Takes the lock again after a nested run that threw", () => {
    const lock = new InMemoryLock();

    expect(() =>
      runExclusively(lock, 0, () => {
        runExclusively(lock, 0, () => {
          throw new Error("boom");
        });
      }),
    ).toThrow("boom");

    expect(runExclusively(lock, 0, () => "again")).toEqual({ ran: true, value: "again" });
  });

  it("Waits up to the given time for the lock", () => {
    const lock = new InMemoryLock();

    runExclusively(lock, 30000, () => undefined);

    expect(lock.waits).toEqual([30000]);
  });
});
