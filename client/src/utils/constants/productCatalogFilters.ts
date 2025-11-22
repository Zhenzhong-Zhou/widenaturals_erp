/**
 * Market region selection options used in product and SKU filtering.
 *
 * These represent logical regions (not ISO country codes) used for product
 * catalog scoping, labeling, and UI dropdown lists.
 *
 * Example:
 *   - Canada
 *   - China
 *   - Universe (global/unrestricted)
 *   - International
 *   - United States
 */
export const MARKET_REGION_OPTIONS = [
  { label: 'Canada', value: 'Canada' },
  { label: 'China', value: 'China' },
  { label: 'Universe', value: 'Universe' },
  { label: 'International', value: 'International' },
  { label: 'US', value: 'United State' },
];

/**
 * ISO-aligned country code options used for SKU and product filtering.
 *
 * These map to 2–3 letter location or locale codes used in SKU metadata.
 *
 * Example:
 *   CA → Canada
 *   CN → China
 *   UN → Universe (custom business code)
 *   INT → International (custom business code)
 *   US → United States
 */
export const COUNTRY_CODE_OPTIONS = [
  { label: 'Canada', value: 'CA' },
  { label: 'China', value: 'CN' },
  { label: 'Universe', value: 'UN' },
  { label: 'International', value: 'INT' },
  { label: 'US', value: 'US' },
];
