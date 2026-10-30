import type { SectionPosition } from "../../types";

export type ChartRange = {
  startRow: number;
  endRow: number;
};

export const resolveChartRange = (
  section: SectionPosition,
  dataRowCount: number,
): ChartRange | null => {
  if (section.start <= 0 || dataRowCount <= 0) {
    return null;
  }
  return { startRow: section.start, endRow: section.start + dataRowCount - 1 };
};
