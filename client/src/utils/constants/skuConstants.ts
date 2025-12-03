import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

/* ========================================================================
 * VARIANT CODE LIST
 * ===================================================================== */

/**
 * A single variant code (SKU segment).
 *
 * Variant codes represent bottle/capsule count, potency, or size.
 * These are **not enforced by business logic**, but provide:
 * - UI dropdown support
 * - Human-readable labels
 * - Consistency across SKU creation
 */
export interface VariantCodeItem {
  code: string;
  label: string;
}

/**
 * Predefined SKU variant codes.
 *
 * Notes:
 * - Codes must match backend regex: /^[A-Z0-9]{1,10}$/
 * - These values are used by Create SKU forms and SKU filters.
 */
const VARIANT_CODES: VariantCodeItem[] = [
  { code: 'S', label: 'Small (30–60 capsules)' },
  { code: 'M', label: 'Medium (80–100 capsules)' },
  { code: 'L', label: 'Large (120–180 capsules)' },
  { code: 'R', label: 'Regular Strength' },
  { code: 'H', label: 'High Potency' },
  { code: 'D', label: 'Double Strength' },
  { code: 'E', label: 'Extra Strength' },
  { code: 'T', label: 'Trial / Travel Size' },
];

/* ========================================================================
 * MARKET REGION CODES (Non-ISO)
 * ===================================================================== */

/**
 * Region code entry used for SKU `market_region`.
 *
 * These values are **business-defined** (not ISO), used for labeling and
 * grouping product availability by region.
 */
export interface MarketRegionCodeItem {
  value: string;
  label: string;
}

/**
 * Predefined market regions.
 *
 * These differ from country codes and reflect business units or
 * marketing regions, not necessarily ISO standards.
 */
const REGION_CODES: MarketRegionCodeItem[] = [
  { value: 'Universal', label: 'Universal' },
  { value: 'China', label: 'China' },
  { value: 'Canada', label: 'Canada' },
  { value: 'United States', label: 'United States' },
  { value: 'International', label: 'International' },
];

/* ========================================================================
 * ISO COUNTRY CODES (Dynamic from library)
 * ===================================================================== */

// Register English names for ISO country data
countries.registerLocale(enLocale);

/**
 * A single ISO country entry (alpha-2 code + English name).
 */
export interface CountryCodeItem {
  code: string;
  name: string;
}

/**
 * Returns a lexicographically sorted list of ISO country codes (alpha-2)
 * and their English display names.
 *
 * Used by:
 * - Region dropdowns
 * - International SKU configuration
 *
 * @returns CountryCodeItem[] sorted alphabetically
 */
export const getCountryCodeItems = (): CountryCodeItem[] => {
  const alpha2 = countries.getAlpha2Codes(); // { CA: 'Canada', US: 'United States', ... }

  return Object.entries(alpha2)
    .map(([code]) => ({
      code,
      name: countries.getName(code, 'en') ?? code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/* ========================================================================
 * SKU-LEVEL PERMISSIONS (RBAC)
 * ===================================================================== */

/**
 * SKU-level permission flags used across:
 * - SKU filtering logic
 * - Create SKU form validation
 * - Order workflows (internal orders, backorders)
 *
 * These string values match backend RBAC permission keys.
 */
export const SKU_CONSTANTS = {
  PERMISSIONS: {
    /** Allow creating SKUs even when inventory is zero */
    ALLOW_BACKORDER_SKUS: 'allow_backorder_skus',

    /** Allow using inactive or discontinued SKUs for internal orders */
    ALLOW_INTERNAL_ORDER_SKUS: 'allow_internal_order_skus',

    /** Admin override permission: bypass all SKU-level filters */
    ADMIN_OVERRIDE_SKU_FILTERS: 'admin_override_sku_filters',
  },

  /** Predefined size/potency/capsule-count codes */
  VARIANT_CODES,

  /** Predefined business-defined market regions */
  REGION_CODES,
};
