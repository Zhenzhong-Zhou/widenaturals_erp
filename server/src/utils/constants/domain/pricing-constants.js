'use strict';

const PRICING_CONSTANTS = {
  PERMISSIONS: {
    // ─── Pricing Types ─────────────────────────────────────────────────────────

    // Can view all pricing types (wholesale, distributor, internal, friend & family, etc.)
    VIEW_ALL_TYPES: 'view_all_types',
    // Can create/edit/delete pricing types
    MANAGE_PRICING_TYPES: 'manage_pricing_types',

    // ─── Pricing Groups ────────────────────────────────────────────────────────

    // Can create/edit/delete pricing groups
    MANAGE_PRICING_GROUPS: 'manage_pricing_groups',
    // Can assign or remove SKUs from a pricing group
    ASSIGN_PRICING_SKUS: 'assign_pricing_skus',

    // ─── Pricing Lifecycle ─────────────────────────────────────────────────────

    // Can view inactive, draft, or unpublished pricing groups
    VIEW_INACTIVE: 'view_inactive_pricing',
    // Can view expired or historical pricing records
    VIEW_HISTORY: 'view_pricing_history',

    // ─── Pricing Status Visibility ─────────────────────────────────────────────

    // Can view all pricing group statuses in lookup/dropdown (inactive, draft, etc.)
    VIEW_ALL_PRICING_STATES: 'view_all_pricing_states',
    // Can view all valid pricing including future-dated or expired
    VIEW_ALL_VALID_PRICING: 'view_all_valid_pricing',

    // ─── Export ────────────────────────────────────────────────────────────────

    // Can export full pricing dataset
    EXPORT_PRICING: 'export_pricing',
  },
};

module.exports = PRICING_CONSTANTS;
