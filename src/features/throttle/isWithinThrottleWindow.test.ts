import { describe, expect, it } from "vitest";
import { isWithinThrottleWindow } from "./isWithinThrottleWindow";

describe("isWithinThrottleWindow", () => {
  it("Reports no recent run when nothing has been recorded", () => {
    expect(isWithinThrottleWindow(null, 100000, 10000)).toBe(false);
  });

  it("Reports a recent run when the last run is inside the window", () => {
    expect(isWithinThrottleWindow("95000", 100000, 10000)).toBe(true);
  });

  it("Reports no recent run once the window has fully elapsed", () => {
    expect(isWithinThrottleWindow("90000", 100000, 10000)).toBe(false);
  });

  it("Reports no recent run when the recorded value is not a timestamp", () => {
    expect(isWithinThrottleWindow("not-a-number", 100000, 10000)).toBe(false);
  });
});
