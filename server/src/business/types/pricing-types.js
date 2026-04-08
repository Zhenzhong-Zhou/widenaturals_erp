/**
 * @typedef {object} PricingViewAcl
 * @property {boolean} canViewAllPricingTypes
 * @property {boolean} canViewInactivePricing
 * @property {boolean} canViewPricingHistory
 * @property {boolean} canViewAllValidPricing
 */

/**
 * @typedef {Object} PricingAcl
 * @property {boolean} canViewAllPricingStates - Can view inactive/draft pricing groups in lookups.
 * @property {boolean} canViewAllValidPricing  - Can view expired or future-dated pricing.
 * @property {boolean} canViewInactive         - Can view inactive pricing groups.
 * @property {boolean} canViewHistory          - Can view expired/historical pricing records.
 * @property {boolean} canExportPricing        - Can export full pricing dataset.
 */
