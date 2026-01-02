import type { StatusColor } from './getStatusColor';

export type BadgeColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

/**
 * Maps semantic StatusColor to a Badge-safe color.
 * Badge does not support `neutral`, so it degrades safely to `default`.
 */
export const mapStatusColorToBadgeColor = (color: StatusColor): BadgeColor => {
  return color === 'neutral' ? 'default' : color;
};
