/**
 * Section position information
 */
export type SectionPosition = {
  start: number;
  end: number;
};

/**
 * Section map
 */
export type SectionsMap = Record<string, SectionPosition>;
