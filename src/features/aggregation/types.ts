/**
 * Transaction data type
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

/**
 * Aggregation result by category type
 */
export type CategoryAggregation = Record<string, number>;
