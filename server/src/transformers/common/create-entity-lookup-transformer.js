const { includeFlagsBasedOnAccess } = require('../../utils/transformer-utils');
const { cleanObject } = require('../../utils/object-utils');

/**
 * Factory: createEntityLookupTransformer
 *
 * Generates a standardized lookup row transformer for simple
 * entity types (Manufacturer, Supplier, etc.).
 *
 * Responsibilities:
 * - Validate row structure
 * - Build primary label
 * - Build optional subLabel
 * - Include optional code
 * - Merge ACL-based UI flags
 * - Return minimal lookup object
 *
 * This function does NOT enforce visibility.
 *
 * @param {Object} config
 * @param {string} config.labelKey
 * @param {string} [config.subLabelKey]
 *
 * @returns {(row: object, acl: object) => object | null}
 */
const createEntityLookupTransformer = ({ labelKey, subLabelKey }) => {
  return (row, acl) => {
    if (!row || typeof row !== 'object') return null;
    if (!row.id || !row[labelKey]) return null;

    const baseObj = {
      id: row.id,
      label: row[labelKey],
      subLabel: subLabelKey ? row[subLabelKey] || undefined : undefined,
    };

    const flagSubset = includeFlagsBasedOnAccess(row, acl);

    return cleanObject({
      ...baseObj,
      ...flagSubset,
    });
  };
};

module.exports = {
  createEntityLookupTransformer,
};
