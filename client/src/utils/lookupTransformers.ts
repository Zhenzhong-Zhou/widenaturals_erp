import { formatLabel } from './textUtils';
import type { LookupOption } from '@features/lookup/state';

interface TransformLookupOptionsConfig {
  preserveHyphen?: boolean;
  preserveDot?: boolean;
}

/**
 * Transforms an array of lookup options by formatting each label into a human-readable form.
 *
 * - Applies `formatLabel()` to each `label` in the options.
 * - Supports preserving hyphens (`-`) and/or middle dots (`·`) if needed.
 *
 * ### Examples:
 * ```ts
 * transformLookupOptions(options); // Default: removes hyphens/dots
 * transformLookupOptions(options, { preserveHyphen: true });
 * transformLookupOptions(options, { preserveDot: true });
 * ```
 *
 * @param raw - The raw lookup options array from the server.
 * @param config - Optional config to preserve certain characters.
 * @returns A new array of options with formatted labels.
 */
export const transformLookupOptions = (
  raw: LookupOption[],
  config: TransformLookupOptionsConfig = {}
): LookupOption[] => {
  return raw.map((opt) => ({
    ...opt,
    label: formatLabel(opt.label, config),
  }));
};
