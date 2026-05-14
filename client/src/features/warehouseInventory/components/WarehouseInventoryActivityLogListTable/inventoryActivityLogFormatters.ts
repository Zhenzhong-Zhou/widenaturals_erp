/**
 * Formatting utilities for inventory activity log quantity changes.
 *
 * Centralizes display rules for signed quantity deltas so the activity
 * log table cell and the row-expand content render them identically.
 *
 * Named exports:
 * - formatQuantityChange
 * - quantityChangeColor
 */

/**
 * Renders a signed quantity delta as a localized string. Positive values
 * get a leading "+" so the sign is unambiguous at a glance; zero and
 * negative values render with their natural prefix.
 */
export const formatQuantityChange = (change: number) =>
  change > 0 ? `+${change.toLocaleString()}` : change.toLocaleString();

/**
 * Maps a signed quantity delta to the MUI theme color path used to
 * convey direction in cell rendering. Positive → success, negative →
 * error, zero → secondary text. Returned string is consumable by an
 * `sx` color prop or theme-aware Typography.
 */
export const quantityChangeColor = (change: number) =>
  change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';
