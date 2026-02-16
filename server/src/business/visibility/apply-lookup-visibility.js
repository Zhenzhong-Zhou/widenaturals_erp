/**
 * Generic: applyLookupVisibilityRules
 *
 * Purpose:
 * - Translate resolved ACL visibility decisions into
 *   repository-safe filter flags for lookup queries.
 *
 * This function:
 * - Does NOT evaluate permissions.
 * - Does NOT inspect raw user roles or permissions.
 * - Assumes ACL has already been resolved by the business layer.
 * - Prevents client-provided filters from overriding visibility constraints.
 *
 * Responsibilities:
 * - Enforce full-visibility overrides when applicable.
 * - Control inclusion of archived records.
 * - Enforce ACTIVE-only filtering when required.
 * - Remove client-provided status filters when ACL restricts them.
 *
 * Guarantees:
 * - Repository receives sanitized visibility flags only.
 * - Client cannot escalate visibility via query parameters.
 *
 * Expected ACL shape:
 * {
 *   canViewArchived: boolean,
 *   enforceActiveOnly: boolean,
 *   [fullVisibilityKey]: boolean
 * }
 *
 * @param {Object} params
 * @param {Object} params.filters - Incoming lookup filters
 * @param {Object} params.acl - Visibility ACL decisions
 * @param {string} params.activeStatusId - ACTIVE status ID
 * @param {string} params.fullVisibilityKey - ACL property name for full override
 *
 * @returns {Object} Adjusted, repository-safe filter object
 */
const applyLookupVisibilityRules = ({
                                      filters,
                                      acl,
                                      activeStatusId,
                                      fullVisibilityKey,
                                    }) => {
  const adjusted = { ...filters };
  
  // ---------------------------------------------------------
  // Full visibility override
  // ---------------------------------------------------------
  if (acl[fullVisibilityKey]) {
    adjusted.includeArchived = true;
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
    return adjusted;
  }
  
  // ---------------------------------------------------------
  // Archive visibility
  // ---------------------------------------------------------
  adjusted.includeArchived = !!acl.canViewArchived;
  
  // ---------------------------------------------------------
  // ACTIVE-only enforcement
  // ---------------------------------------------------------
  if (acl.enforceActiveOnly) {
    adjusted.enforceActiveOnly = true;
    adjusted.activeStatusId = activeStatusId;
    delete adjusted.statusIds;
  } else {
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
  }
  
  return adjusted;
};

module.exports = {
  applyLookupVisibilityRules,
};
