/**
 * Object tracking balances per type
 */
export type BalanceByType = Record<string, number>;

/**
 * Aggregation result by category
 */
export type CategoryAggregation = Record<string, number>;

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

/**
 * Transaction data
 */
export type TransactionData = {
  date: Date | null;
  type: string;
  category: string;
  description: string;
  income: number;
  expense: number;
  total: number;
};
