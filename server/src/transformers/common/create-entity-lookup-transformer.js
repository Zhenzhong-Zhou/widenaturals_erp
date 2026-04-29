/**
 * @file create-entity-lookup-transformer.js
 * @description Factory for creating reusable entity lookup row transformers.
 *
 * Exports:
 *   - createEntityLookupTransformer – returns a configured per-row transformer
 *     for entity lookup dropdowns (manufacturer, supplier, location type, etc.)
 *
 * All produced transformers are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { STANDARD_FLAG_MAP } = require('../../utils/constants/lookup-flag-maps');
const { cleanObject } = require('../../utils/object-utils');
const { includeFlagsBasedOnAccess } = require('../../utils/transformer-utils');

/**
 * Creates a reusable lookup row transformer for a given entity shape.
 *
 * The produced transformer maps a raw DB row into the standard dropdown shape
 * `{ id, label, subLabel?, ...flags }`, applying ACL-based flag inclusion.
 *
 * Rows missing `id` or the configured `labelKey` value are skipped (return `null`).
 * Callers should ensure nulls are filtered — `transformLoadMoreResult` does this automatically.
 *
 * @param {Object}   config
 * @param {string}   config.labelKey             - Row field to use as the dropdown label.
 * @param {string}   [config.subLabelKey]        - Optional row field to use as secondary label.
 * @param {FlagMap}  [config.flagMap]            - ACL-to-row-property map for flag inclusion.
 *                                                 Defaults to `DEFAULT_ENTITY_FLAG_MAP`.
 *
 * @returns {(row: Object, acl: Object) => Object|null} Per-row transformer function.
 *
 * @example
 * const transformManufacturerLookup = createEntityLookupTransformer({
 *   labelKey:    'name',
 *   subLabelKey: 'contact_name',
 * });
 *
 * // transformManufacturerLookup(row, acl) → { id, label, subLabel?, ...flags }
 *
 * @example
 * // With a custom flag map:
 * const transformCustomLookup = createEntityLookupTransformer({
 *   labelKey: 'name',
 *   flagMap:  { canViewAllStatuses: 'isActive' },
 * });
 */
const createEntityLookupTransformer =
  ({ labelKey, subLabelKey, flagMap = STANDARD_FLAG_MAP }) =>
  /**
   * @param {Object} row - Raw DB row for a single lookup entity.
   * @param {Object} acl - Access control context for flag visibility.
   * @returns {Object|null} Transformed dropdown item, or `null` if row is invalid.
   */
  (row, acl) => {
    if (!row || typeof row !== 'object') return null;
    if (!row.id || !row[labelKey]) return null;

    return cleanObject({
      id: row.id,
      label: row[labelKey],
      // Only include subLabel when a key is configured and the field has a value.
      subLabel: subLabelKey ? (row[subLabelKey] ?? undefined) : undefined,
      ...includeFlagsBasedOnAccess(row, acl, flagMap),
    });
  };

module.exports = {
  createEntityLookupTransformer,
};
