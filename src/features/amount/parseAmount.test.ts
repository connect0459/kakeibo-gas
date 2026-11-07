import { describe, expect, test } from "vitest";
import { parseAmount } from "./parseAmount";

describe("parseAmount", () => {
  test("A numeric amount is kept as is", () => {
    expect(parseAmount(1500)).toBe(1500);
    expect(parseAmount(0)).toBe(0);
    expect(parseAmount(12.5)).toBe(12.5);
  });

  test("An empty cell counts as zero", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("   ")).toBe(0);
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
  });

  test("Text with thousands separators reads as the same amount as the number", () => {
    expect(parseAmount("1,000")).toBe(1000);
    expect(parseAmount(" 1,234,567 ")).toBe(1234567);
    expect(parseAmount("800")).toBe(800);
    expect(parseAmount("12.5")).toBe(12.5);
  });

  test("Parenthesized text is rejected instead of being read as a positive amount", () => {
    expect(parseAmount("(1,000)")).toBeNull();
  });

  test("Triangle-marked text is rejected instead of being read as a positive amount", () => {
    expect(parseAmount("▲500")).toBeNull();
  });

  test("Unicode-minus text is rejected instead of losing its sign", () => {
    expect(parseAmount("−500")).toBeNull();
  });

  test("Exponent notation is rejected instead of having its letters stripped", () => {
    expect(parseAmount("1e3")).toBeNull();
  });

  test("A negative amount is read with its sign whether typed as a number or as text", () => {
    expect(parseAmount(-500)).toBe(-500);
    expect(parseAmount("-500")).toBe(-500);
    expect(parseAmount(" -1,234 ")).toBe(-1234);
  });

  test("A minus sign that is not directly before the digits is rejected", () => {
    expect(parseAmount("--500")).toBeNull();
    expect(parseAmount("5-00")).toBeNull();
    expect(parseAmount("- 500")).toBeNull();
  });

  test("Text that is not a plain number is rejected", () => {
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("1,00")).toBeNull();
    expect(parseAmount("12 000")).toBeNull();
    expect(parseAmount("¥1,000")).toBeNull();
  });

  test("Non-finite numbers and non-numeric cell values are rejected", () => {
    expect(parseAmount(Number.NaN)).toBeNull();
    expect(parseAmount(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseAmount(new Date())).toBeNull();
    expect(parseAmount(true)).toBeNull();
  });
});
