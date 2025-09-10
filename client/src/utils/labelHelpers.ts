import type { JSX } from 'react';

/**
 * Normalizes a label into a plain string for use in Autocomplete's `getOptionLabel`.
 *
 * - Ensures JSX labels don’t break equality checks or trigger re-fetches.
 * - Converts non-string values (null, undefined, numbers, JSX) into a safe string.
 *
 * @param label - The label value (string, JSX, or other).
 * @returns Plain string version of the label (never null/undefined).
 */
export const getRawLabel = (label: string | JSX.Element | null | undefined): string => {
  return typeof label === 'string' ? label : String(label ?? '');
};
