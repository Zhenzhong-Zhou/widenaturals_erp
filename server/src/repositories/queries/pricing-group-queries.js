// ─── Batch Fetch By ID + SKU Pairs ────────────────────────────────────────────

// Fetches only rows where both price_id and sku_id match — returns matched
// pairs only, silently drops unmatched inputs.
// $1: price_ids (UUID array), $2: sku_ids (UUID array)
const PRICING_PRICE_BY_GROUP_SKU_PAIRS_QUERY = `
  WITH input(pricing_id, sku_id) AS (
    SELECT * FROM UNNEST($1::uuid[], $2::uuid[])
  )
  SELECT
    i.pricing_id,
    i.sku_id,
    p.pricing_group_id,
    pg.price
  FROM input i
  JOIN pricing p
    ON p.id = i.pricing_id
   AND p.sku_id = i.sku_id
  JOIN pricing_groups pg
    ON pg.id = p.pricing_group_id;
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const PRICING_GROUP_LOOKUP_TABLE = 'pricing_groups pg';

const PRICING_GROUP_LOOKUP_JOINS = [
  'JOIN  pricing       p  ON p.pricing_group_id = pg.id',
  'JOIN  skus          s  ON s.id               = p.sku_id',
  'JOIN  pricing_types pt ON pt.id              = pg.pricing_type_id',
  'JOIN  products      pr ON pr.id              = s.product_id',
];

const _PRICING_GROUP_LOOKUP_JOINS_SQL = PRICING_GROUP_LOOKUP_JOINS.join('\n  ');

const PRICING_GROUP_LOOKUP_SORT_WHITELIST = new Set([
  'pt.name',
  'pg.valid_from',
  'pg.id',
]);

const PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'pg.valid_from', direction: 'DESC' },
];

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildPricingGroupLookupQuery = (whereClause) => `
  SELECT
    pg.id                         AS pricing_group_id,
    pg.price,
    pt.name                       AS price_type,
    pr.name                       AS product_name,
    pr.brand,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code,
    pg.valid_from,
    pg.valid_to,
    pg.status_id
  FROM ${PRICING_GROUP_LOOKUP_TABLE}
  ${_PRICING_GROUP_LOOKUP_JOINS_SQL}
  WHERE ${whereClause}
`;

module.exports = {
  PRICING_PRICE_BY_GROUP_SKU_PAIRS_QUERY,
  PRICING_GROUP_LOOKUP_TABLE,
  PRICING_GROUP_LOOKUP_JOINS,
  PRICING_GROUP_LOOKUP_SORT_WHITELIST,
  PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS,
  buildPricingGroupLookupQuery,
}