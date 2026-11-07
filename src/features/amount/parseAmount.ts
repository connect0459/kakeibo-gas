const PLAIN_AMOUNT = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;

export const parseAmount = (value: unknown): number | null => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (text === "") return 0;
  if (!PLAIN_AMOUNT.test(text)) return null;
  return Number(text.replace(/,/g, ""));
};
