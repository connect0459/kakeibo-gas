/**
 * Type definition file
 */

/**
 * Transaction data type definition
 */
export interface TransactionData {
  date: Date | null;
  type: string;
  category: string;
  description: string;
  income: number;
  expense: number;
  total: number;
}

/**
 * Aggregation result by category type definition
 */
export interface CategoryAggregation {
  [category: string]: number;
}

/**
 * Balance by type type definition
 */
export interface BalanceByType {
  [type: string]: number;
}

/**
 * Section position information type definition
 */
export interface SectionPosition {
  start: number;
  end: number;
}

/**
 * Map of section information
 */
export interface SectionsMap {
  [key: string]: SectionPosition;
}
