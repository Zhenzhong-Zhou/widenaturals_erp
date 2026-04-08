/**
 * @typedef {Object} PricingGroupAcl
 * @property {boolean} canViewAllPricingStates - Can view inactive/draft pricing groups.
 * @property {boolean} canViewAllValidPricing  - Can view expired or future-dated pricing groups.
 * @property {boolean} canViewInactive         - Can view inactive pricing groups.
 * @property {boolean} canManagePricingGroups  - Can create/edit/delete pricing groups.
 * @property {boolean} canAssignSkus           - Can assign/remove SKUs from a pricing group.
 */

/**
 * @typedef {Object} PricingGroupLookupAcl
 * @property {boolean} canViewAllPricingStates - Can view inactive/draft groups in lookups.
 * @property {boolean} canViewAllValidPricing  - Can view expired or future-dated groups in lookups.
 */
