const DAY_MS = 86400000;

const offsetMinutesAt = (instant: number, timeZone: string): number => {
  const offset = Utilities.formatDate(new Date(instant), timeZone, "Z");
  const sign = offset.startsWith("-") ? -1 : 1;
  return sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(3, 5)));
};

export const startOfDayInZone = (
  timeZone: string,
  year: number,
  monthIndex: number,
  day: number,
): Date => {
  const wallClock = Date.UTC(year, monthIndex, day);
  const candidates = [-DAY_MS, DAY_MS]
    .map((shift) => wallClock - offsetMinutesAt(wallClock + shift, timeZone) * 60000)
    .sort((a, b) => a - b);
  const earliestValid = candidates.find(
    (instant) => wallClock - offsetMinutesAt(instant, timeZone) * 60000 === instant,
  );
  return new Date(earliestValid ?? candidates[1]);
};
