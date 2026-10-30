import { describe, expect, it } from "vitest";
import { parseKindWord } from "./parseKindWord";

describe("parseKindWord", () => {
  it.each(["収入", "Income"])("reads %s as income", (word) => {
    expect(parseKindWord(word)).toBe("income");
  });

  it.each(["支出", "Expense"])("reads %s as expense", (word) => {
    expect(parseKindWord(word)).toBe("expense");
  });

  it("accepts the words of every dictionary, so changing the language does not invalidate a sheet", () => {
    expect(parseKindWord("Income")).toBe(parseKindWord("収入"));
    expect(parseKindWord("Expense")).toBe(parseKindWord("支出"));
  });

  it("ignores case and surrounding whitespace", () => {
    expect(parseKindWord("  income ")).toBe("income");
    expect(parseKindWord("EXPENSE")).toBe("expense");
  });

  it.each(["", "  ", "Revenue", "収", "収入-給与", "支出入"])("does not read %j", (text) => {
    expect(parseKindWord(text)).toBeUndefined();
  });

  it.each([undefined, null, 0, 1, true, {}])("does not read the non-text value %j", (value) => {
    expect(parseKindWord(value)).toBeUndefined();
  });
});
