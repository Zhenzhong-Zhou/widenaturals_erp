const PRICING_CONSTANTS = {
  PERMISSIONS: {
    // Base permission: can the user view pricing at all?
    VIEW_PRICING: 'sku.pricing.view',

    // Pricing dimension access (types of pricing)
    VIEW_ALL_TYPES: 'sku.pricing.view_all_types', // wholesale, distributor, internal, etc.

    // Pricing lifecycle access
    VIEW_INACTIVE: 'sku.pricing.view_inactive', // inactive, draft, unpublished pricing
    VIEW_HISTORY: 'sku.pricing.view_history', // expired / previous pricing records

    // Pricing lookup access (from your original constants)
    VIEW_ALL_PRICING_STATES: 'view_all_pricing_states', // access inactive/draft in lookup tables
    VIEW_ALL_VALID_PRICING: 'view_all_valid_pricing', // access expired or future-dated pricing
  },
};

module.exports = PRICING_CONSTANTS;
