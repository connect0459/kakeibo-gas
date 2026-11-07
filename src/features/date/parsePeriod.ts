const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type Period = { startDate: string; endDate: string };

const isRealCalendarDate = (text: unknown): text is string => {
  if (typeof text !== "string") return false;
  const match = ISO_DATE.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

export const parsePeriod = (startDate: unknown, endDate: unknown): Period | null => {
  if (!isRealCalendarDate(startDate) || !isRealCalendarDate(endDate)) return null;
  if (startDate > endDate) return null;
  return { startDate, endDate };
};
