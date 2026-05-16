/**
 * @file formatOptionLabels.ts
 * @description Shared option-label formatting utilities for dropdown, lookup,
 * multi-select, and filter option lists.
 *
 * Provides:
 * - formatOptionLabel: formats a single option label while preserving all fields.
 * - formatOptionLabels: formats an array of option labels.
 * - useFormattedOptionLabels: React memoized wrapper for formatting option lists
 *   inside components.
 *
 * These helpers are intentionally generic. Any option type with a `label: string`
 * field is supported, and all extra fields such as `value`, `isActive`, `meta`,
 * `disabled`, or `color` are preserved.
 */

import { useMemo } from 'react';
import { formatLabel } from '@utils/textUtils';

/**
 * Minimum option shape required by the label-formatting helpers.
 *
 * Generic option types may include additional fields, but they must contain
 * a string `label` field.
 */
type LabelOption = {
  label: string;
};

/**
 * Optional configuration accepted by `formatLabel`.
 *
 * Example:
 * ```ts
 * { preserveHyphen: true }
 * ```
 */
type FormatLabelOptions = Parameters<typeof formatLabel>[1];

/**
 * Formats the label of a single option while preserving the original option shape.
 *
 * @template T - Option type that includes at least a `label: string` field.
 * @param option - The option whose label should be formatted.
 * @param formatOptions - Optional formatting configuration passed to `formatLabel`.
 * @returns A new option object with the formatted label and all original fields preserved.
 */
export const formatOptionLabel = <T extends LabelOption>(
  option: T,
  formatOptions?: FormatLabelOptions
): T => ({
  ...option,
  label: formatLabel(option.label, formatOptions),
});

/**
 * Formats labels for an array of options while preserving each option's full shape.
 *
 * @template T - Option type that includes at least a `label: string` field.
 * @param options - Option array to format.
 * @param formatOptions - Optional formatting configuration passed to `formatLabel`.
 * @returns A new array of options with formatted labels.
 */
export const formatOptionLabels = <T extends LabelOption>(
  options: T[],
  formatOptions?: FormatLabelOptions
): T[] => options.map((option) => formatOptionLabel(option, formatOptions));

/**
 * React hook for memoizing formatted option labels inside components.
 *
 * Use this when formatting dropdown, lookup, filter, or multi-select options
 * directly in a React component.
 *
 * @template T - Option type that includes at least a `label: string` field.
 * @param options - Option array to format.
 * @param formatOptions - Optional formatting configuration passed to `formatLabel`.
 * @returns A memoized array of options with formatted labels.
 */
export const useFormattedOptionLabels = <T extends LabelOption>(
  options: T[],
  formatOptions?: FormatLabelOptions
): T[] =>
  useMemo(
    () => formatOptionLabels(options, formatOptions),
    [options, formatOptions]
  );
