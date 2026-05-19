/**
 * Dummy pricing data for seeding/testing.
 *
 * Shape: each entry pairs a SKU with an array of price rows.
 * Each price row uses the `slug` from the `pricing_types` table as the type key.
 *
 * Available pricing type slugs (from pricing_types):
 *   msrp, product_cost, retail, friend_and_family_price, discount_price,
 *   wholesale, employee_discount, sample_price, seasonal_discount, clearance,
 *   promotional, loyalty_program_price, exclusive_member_price, bulk_purchase_discount
 */
const pricingData = [
  // ─── Canaherb ────────────────────────────────────────────────────────────
  {
    sku: 'CH-HN100-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'employee_discount', price: 12 },
      { type: 'promotional', price: 34.99 },
      { type: 'loyalty_program_price', price: 36.99 },
    ],
  },
  {
    sku: 'CH-HN101-R-CA',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'seasonal_discount', price: 32.5 },
      { type: 'clearance', price: 24.99 },
    ],
  },
  {
    sku: 'CH-HN102-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'exclusive_member_price', price: 33.5 },
      { type: 'sample_price', price: 2 },
    ],
  },
  {
    sku: 'CH-HN103-R-CA',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'discount_price', price: 35.99 },
      { type: 'bulk_purchase_discount', price: 16.5 },
    ],
  },
  {
    sku: 'CH-HN104-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'promotional', price: 33.99 },
    ],
  },
  {
    sku: 'CH-HN105-R-CA',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'employee_discount', price: 12 },
      { type: 'loyalty_program_price', price: 36.99 },
    ],
  },
  {
    sku: 'CH-HN106-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'clearance', price: 22.99 },
    ],
  },
  {
    sku: 'CH-HN107-R-CA',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'seasonal_discount', price: 31.99 },
      { type: 'sample_price', price: 2 },
    ],
  },
  {
    sku: 'CH-HN108-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'exclusive_member_price', price: 33.5 },
    ],
  },
  {
    sku: 'CH-HN109-R-CA',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'bulk_purchase_discount', price: 16.5 },
      { type: 'discount_price', price: 35.99 },
    ],
  },
  {
    sku: 'CH-HN110-R-CN',
    prices: [
      { type: 'product_cost', price: 8.9 },
      { type: 'wholesale', price: 21.5 },
      { type: 'msrp', price: 47.99 },
      { type: 'retail', price: 47.99 },
      { type: 'friend_and_family_price', price: 33 },
      { type: 'promotional', price: 39.99 },
      { type: 'loyalty_program_price', price: 42.99 },
    ],
  },
  {
    sku: 'CH-HN111-R-CA',
    prices: [
      { type: 'product_cost', price: 8.9 },
      { type: 'wholesale', price: 21.5 },
      { type: 'msrp', price: 47.99 },
      { type: 'retail', price: 47.99 },
      { type: 'friend_and_family_price', price: 33 },
      { type: 'employee_discount', price: 14 },
      { type: 'clearance', price: 28.99 },
    ],
  },
  {
    sku: 'CH-HN112-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
    ],
  },
  {
    sku: 'CH-HN113-R-CA',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'seasonal_discount', price: 31.99 },
    ],
  },
  {
    sku: 'CH-HN114-R-CN',
    prices: [
      { type: 'product_cost', price: 7.5 },
      { type: 'wholesale', price: 18.5 },
      { type: 'msrp', price: 41.99 },
      { type: 'retail', price: 41.99 },
      { type: 'friend_and_family_price', price: 28 },
      { type: 'exclusive_member_price', price: 33.5 },
    ],
  },
  {
    sku: 'CH-HN115-R-UN',
    prices: [
      { type: 'product_cost', price: 5.5 },
      { type: 'wholesale', price: 13.5 },
      { type: 'msrp', price: 28.99 },
      { type: 'retail', price: 28.99 },
      { type: 'friend_and_family_price', price: 18 },
      { type: 'promotional', price: 23.99 },
    ],
  },
  {
    sku: 'CH-HN116-R-UN',
    prices: [
      { type: 'product_cost', price: 5.5 },
      { type: 'wholesale', price: 13.5 },
      { type: 'msrp', price: 34.99 },
      { type: 'retail', price: 34.99 },
      { type: 'friend_and_family_price', price: 23 },
      { type: 'loyalty_program_price', price: 30.99 },
      { type: 'sample_price', price: 1.5 },
    ],
  },
  
  // ─── PG ──────────────────────────────────────────────────────────────────
  {
    sku: 'PG-NM200-R-CN',
    prices: [
      { type: 'product_cost', price: 22 },
      { type: 'wholesale', price: 56 },
      { type: 'msrp', price: 108 },
      { type: 'retail', price: 345 },
      { type: 'friend_and_family_price', price: 114 },
      { type: 'employee_discount', price: 40 },
      { type: 'promotional', price: 289 },
      { type: 'exclusive_member_price', price: 199 },
    ],
  },
  {
    sku: 'PG-NM201-R-CA',
    prices: [
      { type: 'product_cost', price: 22 },
      { type: 'wholesale', price: 56 },
      { type: 'msrp', price: 108 },
      { type: 'retail', price: 345 },
      { type: 'friend_and_family_price', price: 114 },
      { type: 'seasonal_discount', price: 269 },
      { type: 'bulk_purchase_discount', price: 48 },
    ],
  },
  {
    sku: 'PG-NM202-R-CN',
    prices: [
      { type: 'product_cost', price: 30 },
      { type: 'wholesale', price: 72 },
      { type: 'msrp', price: 195 },
      { type: 'retail', price: 640 },
      { type: 'friend_and_family_price', price: 145 },
      { type: 'loyalty_program_price', price: 549 },
      { type: 'discount_price', price: 499 },
    ],
  },
  {
    sku: 'PG-NM203-R-CA',
    prices: [
      { type: 'product_cost', price: 30 },
      { type: 'wholesale', price: 72 },
      { type: 'msrp', price: 195 },
      { type: 'retail', price: 640 },
      { type: 'friend_and_family_price', price: 145 },
      { type: 'clearance', price: 449 },
      { type: 'exclusive_member_price', price: 379 },
    ],
  },
  {
    sku: 'PG-NM204-R-CN',
    prices: [
      { type: 'product_cost', price: 40 },
      { type: 'wholesale', price: 95 },
      { type: 'msrp', price: 275 },
      { type: 'retail', price: 940 },
      { type: 'friend_and_family_price', price: 190 },
      { type: 'promotional', price: 799 },
    ],
  },
  {
    sku: 'PG-NM205-R-CA',
    prices: [
      { type: 'product_cost', price: 40 },
      { type: 'wholesale', price: 95 },
      { type: 'msrp', price: 275 },
      { type: 'retail', price: 940 },
      { type: 'friend_and_family_price', price: 190 },
      { type: 'employee_discount', price: 75 },
      { type: 'bulk_purchase_discount', price: 82 },
    ],
  },
  {
    sku: 'PG-NM206-R-CN',
    prices: [
      { type: 'product_cost', price: 55 },
      { type: 'wholesale', price: 120 },
      { type: 'msrp', price: 445 },
      { type: 'retail', price: 1470 },
      { type: 'friend_and_family_price', price: 245 },
      { type: 'loyalty_program_price', price: 1299 },
      { type: 'exclusive_member_price', price: 899 },
    ],
  },
  {
    sku: 'PG-NM207-R-CA',
    prices: [
      { type: 'product_cost', price: 55 },
      { type: 'wholesale', price: 120 },
      { type: 'msrp', price: 445 },
      { type: 'retail', price: 1470 },
      { type: 'friend_and_family_price', price: 245 },
      { type: 'seasonal_discount', price: 1199 },
    ],
  },
  {
    sku: 'PG-NM208-R-CN',
    prices: [
      { type: 'product_cost', price: 80 },
      { type: 'wholesale', price: 178 },
      { type: 'msrp', price: 720 },
      { type: 'retail', price: 2390 },
      { type: 'friend_and_family_price', price: 360 },
      { type: 'discount_price', price: 1999 },
      { type: 'clearance', price: 1599 },
    ],
  },
  {
    sku: 'PG-NM209-R-CA',
    prices: [
      { type: 'product_cost', price: 80 },
      { type: 'wholesale', price: 178 },
      { type: 'msrp', price: 720 },
      { type: 'retail', price: 2390 },
      { type: 'friend_and_family_price', price: 360 },
      { type: 'promotional', price: 2099 },
    ],
  },
  {
    sku: 'PG-TCM300-R-CN',
    prices: [
      { type: 'product_cost', price: 18 },
      { type: 'wholesale', price: 44 },
      { type: 'msrp', price: 175 },
      { type: 'retail', price: 590 },
      { type: 'friend_and_family_price', price: 88 },
      { type: 'loyalty_program_price', price: 499 },
      { type: 'sample_price', price: 5 },
    ],
  },
  {
    sku: 'PG-TCM301-R-CA',
    prices: [
      { type: 'product_cost', price: 18 },
      { type: 'wholesale', price: 44 },
      { type: 'msrp', price: 175 },
      { type: 'retail', price: 590 },
      { type: 'friend_and_family_price', price: 88 },
      { type: 'exclusive_member_price', price: 449 },
    ],
  },
  {
    sku: 'PG-MO400-R-CN',
    prices: [
      { type: 'product_cost', price: 6.5 },
      { type: 'wholesale', price: 15.5 },
      { type: 'msrp', price: 33.99 },
      { type: 'retail', price: 48.99 },
      { type: 'friend_and_family_price', price: 28.99 },
      { type: 'promotional', price: 39.99 },
      { type: 'seasonal_discount', price: 36.99 },
    ],
  },
  {
    sku: 'PG-AO500-S-CN',
    prices: [
      { type: 'product_cost', price: 7.2 },
      { type: 'wholesale', price: 17.5 },
      { type: 'msrp', price: 40.99 },
      { type: 'retail', price: 58.99 },
      { type: 'friend_and_family_price', price: 34.99 },
      { type: 'employee_discount', price: 12 },
      { type: 'loyalty_program_price', price: 49.99 },
    ],
  },
  {
    sku: 'PG-CL600-R-CN',
    prices: [
      { type: 'product_cost', price: 10.5 },
      { type: 'wholesale', price: 24.5 },
      { type: 'msrp', price: 61.99 },
      { type: 'retail', price: 88.99 },
      { type: 'friend_and_family_price', price: 52.99 },
      { type: 'discount_price', price: 74.99 },
      { type: 'bulk_purchase_discount', price: 21.5 },
    ],
  },
  {
    sku: 'PG-HH700-R-CN',
    prices: [
      { type: 'product_cost', price: 10.5 },
      { type: 'wholesale', price: 24.5 },
      { type: 'msrp', price: 56.99 },
      { type: 'retail', price: 80.99 },
      { type: 'friend_and_family_price', price: 48.99 },
      { type: 'exclusive_member_price', price: 64.99 },
      { type: 'sample_price', price: 4 },
    ],
  },
  
  // ─── WIDE Naturals ───────────────────────────────────────────────────────
  {
    sku: 'WN-MO800-S-UN',
    prices: [
      { type: 'product_cost', price: 3.5 },
      { type: 'wholesale', price: 8.5 },
      { type: 'msrp', price: 28.99 },
      { type: 'retail', price: 28.99 },
      { type: 'promotional', price: 23.99 },
      { type: 'sample_price', price: 1 },
    ],
  },
  {
    sku: 'WN-MO801-L-UN',
    prices: [
      { type: 'product_cost', price: 4.5 },
      { type: 'wholesale', price: 10.5 },
      { type: 'msrp', price: 38.99 },
      { type: 'retail', price: 38.99 },
      { type: 'seasonal_discount', price: 32.99 },
      { type: 'clearance', price: 26.99 },
    ],
  },
  {
    sku: 'WN-MO802-S-UN',
    prices: [
      { type: 'product_cost', price: 4 },
      { type: 'wholesale', price: 9.8 },
      { type: 'msrp', price: 24.99 },
      { type: 'retail', price: 24.99 },
      { type: 'employee_discount', price: 7 },
      { type: 'loyalty_program_price', price: 21.99 },
    ],
  },
  {
    sku: 'WN-MO803-L-UN',
    prices: [
      { type: 'product_cost', price: 7 },
      { type: 'wholesale', price: 17.5 },
      { type: 'msrp', price: 39.98 },
      { type: 'retail', price: 39.98 },
      { type: 'discount_price', price: 34.98 },
      { type: 'bulk_purchase_discount', price: 16 },
    ],
  },
  {
    sku: 'WN-MO804-S-UN',
    prices: [
      { type: 'product_cost', price: 3.8 },
      { type: 'wholesale', price: 9.1 },
      { type: 'msrp', price: 23.99 },
      { type: 'retail', price: 23.99 },
      { type: 'promotional', price: 19.99 },
      { type: 'exclusive_member_price', price: 17.99 },
    ],
  },
  {
    sku: 'WN-MO805-L-UN',
    prices: [
      { type: 'product_cost', price: 6.5 },
      { type: 'wholesale', price: 15.9 },
      { type: 'msrp', price: 38.99 },
      { type: 'retail', price: 38.99 },
      { type: 'seasonal_discount', price: 33.99 },
    ],
  },
  {
    sku: 'WN-MO806-S-UN',
    prices: [
      { type: 'product_cost', price: 3.8 },
      { type: 'wholesale', price: 9.1 },
      { type: 'msrp', price: 23.99 },
      { type: 'retail', price: 23.99 },
      { type: 'loyalty_program_price', price: 20.99 },
      { type: 'sample_price', price: 1 },
    ],
  },
  {
    sku: 'WN-MO807-L-UN',
    prices: [
      { type: 'product_cost', price: 6.5 },
      { type: 'wholesale', price: 15.9 },
      { type: 'msrp', price: 38.99 },
      { type: 'retail', price: 38.99 },
      { type: 'clearance', price: 27.99 },
    ],
  },
  {
    sku: 'WN-MO808-S-UN',
    prices: [
      { type: 'product_cost', price: 2.5 },
      { type: 'wholesale', price: 6.3 },
      { type: 'msrp', price: 18.99 },
      { type: 'retail', price: 18.99 },
      { type: 'promotional', price: 15.99 },
      { type: 'employee_discount', price: 5 },
    ],
  },
  {
    sku: 'WN-MO809-L-UN',
    prices: [
      { type: 'product_cost', price: 4.5 },
      { type: 'wholesale', price: 11.3 },
      { type: 'msrp', price: 28.99 },
      { type: 'retail', price: 28.99 },
      { type: 'discount_price', price: 24.99 },
      { type: 'exclusive_member_price', price: 22.99 },
    ],
  },
  {
    sku: 'WN-MO810-S-UN',
    prices: [
      { type: 'product_cost', price: 2.5 },
      { type: 'wholesale', price: 6.3 },
      { type: 'msrp', price: 18.99 },
      { type: 'retail', price: 18.99 },
      { type: 'seasonal_discount', price: 16.99 },
    ],
  },
  {
    sku: 'WN-MO811-L-UN',
    prices: [
      { type: 'product_cost', price: 4.5 },
      { type: 'wholesale', price: 11.3 },
      { type: 'msrp', price: 28.99 },
      { type: 'retail', price: 28.99 },
      { type: 'bulk_purchase_discount', price: 10 },
      { type: 'loyalty_program_price', price: 25.99 },
    ],
  },
  {
    sku: 'WN-MO812-S-UN',
    prices: [
      { type: 'product_cost', price: 5 },
      { type: 'wholesale', price: 11.5 },
      { type: 'msrp', price: 26.99 },
      { type: 'retail', price: 38.99 },
      { type: 'friend_and_family_price', price: 22.99 },
      { type: 'promotional', price: 31.99 },
    ],
  },
  {
    sku: 'WN-BH900-S-UN',
    prices: [
      { type: 'product_cost', price: 3.8 },
      { type: 'wholesale', price: 9 },
      { type: 'msrp', price: 20.99 },
      { type: 'retail', price: 29.99 },
      { type: 'friend_and_family_price', price: 17.99 },
      { type: 'clearance', price: 22.99 },
      { type: 'sample_price', price: 1.5 },
    ],
  },
  {
    sku: 'WN-HH1000-S-UN',
    prices: [
      { type: 'product_cost', price: 7 },
      { type: 'wholesale', price: 16.5 },
      { type: 'msrp', price: 38.99 },
      { type: 'retail', price: 54.99 },
      { type: 'friend_and_family_price', price: 32.99 },
      { type: 'exclusive_member_price', price: 44.99 },
      { type: 'employee_discount', price: 11 },
    ],
  },
  {
    sku: 'WN-GH1100-R-UN',
    prices: [
      { type: 'product_cost', price: 8.5 },
      { type: 'wholesale', price: 19.5 },
      { type: 'msrp', price: 45.99 },
      { type: 'retail', price: 64.99 },
      { type: 'friend_and_family_price', price: 38.99 },
      { type: 'loyalty_program_price', price: 54.99 },
      { type: 'discount_price', price: 49.99 },
      { type: 'bulk_purchase_discount', price: 17.5 },
    ],
  },
];

module.exports = pricingData;
