import {
  ORDER_CATEGORIES,
  type OrderCategory,
} from '@utils/constants/orderPermissions';

/**
 * Type guard to check if a given string is a valid order category.
 *
 * This ensures that a dynamic string (e.g., from route params) matches
 * one of the supported categories used in permissions and order handling.
 *
 * @param value - The category string to validate.
 * @returns True if the value is a valid OrderCategory.
 *
 * @example
 *   isValidOrderCategory('sales') // true
 *   isValidOrderCategory('invalid') // false
 */
export const isValidOrderCategory = (value: string): value is OrderCategory => {
  return ORDER_CATEGORIES.includes(value as OrderCategory);
};
