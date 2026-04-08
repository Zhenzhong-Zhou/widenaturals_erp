/**
 * @file order-queries.js
 * @description SQL query constants and factory functions for order-repository.js.
 *
 * Exports:
 *  - ORDER_INSERT_QUERY                — insert single order record
 *  - ORDER_PAGINATED_TABLE             — aliased table name for paginated query
 *  - ORDER_PAGINATED_JOINS             — join array for paginated query
 *  - ORDER_PAGINATED_SORT_WHITELIST    — valid sort fields for paginated query
 *  - buildOrderPaginatedQuery          — factory for paginated list query
 *  - ORDER_FIND_BY_ID_QUERY            — full detail fetch by order id
 *  - ORDER_FETCH_METADATA_QUERY        — lightweight metadata fetch by order id
 *  - ORDER_UPDATE_STATUS_QUERY         — update order status by id
 *  - ORDER_GET_ALLOCATIONS_QUERY       — fetch allocations by order id
 *  - ORDER_GET_SHIPMENT_METADATA_QUERY — fetch shipment metadata by order id
 */

'use strict';

// ─── Insert ───────────────────────────────────────────────────────────────────

// $1-$11: id, order_number, order_type_id, order_date, order_status_id,
//         note, shipping_address_id, billing_address_id, created_by,
//         updated_at, updated_by
const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');
const ORDER_INSERT_QUERY = `
  INSERT INTO orders (
    id,
    order_number,
    order_type_id,
    order_date,
    order_status_id,
    note,
    shipping_address_id,
    billing_address_id,
    created_by,
    updated_at,
    updated_by
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  RETURNING id
`;

// ─── Paginated List ───────────────────────────────────────────────────────────

const ORDER_PAGINATED_TABLE = 'orders o';

const ORDER_PAGINATED_JOINS = [
  'LEFT JOIN order_types    ot          ON o.order_type_id       = ot.id',
  'LEFT JOIN order_status   os          ON o.order_status_id     = os.id',
  'LEFT JOIN users          u_created   ON o.created_by          = u_created.id',
  'LEFT JOIN users          u_updated   ON o.updated_by          = u_updated.id',
  'LEFT JOIN sales_orders   so          ON so.id                 = o.id',
  'LEFT JOIN customers      c           ON so.customer_id        = c.id',
  'LEFT JOIN payment_methods pm         ON so.payment_method_id  = pm.id',
  'LEFT JOIN delivery_methods dm        ON so.delivery_method_id = dm.id',
  'LEFT JOIN payment_status  ps         ON so.payment_status_id  = ps.id',
];

const _ORDER_PAGINATED_JOINS_SQL = ORDER_PAGINATED_JOINS.join('\n  ');

const ORDER_PAGINATED_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.orderSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildOrderFilter.
 * @returns {string}
 */
const buildOrderPaginatedQuery = (whereClause) => `
  SELECT
    o.id,
    o.order_number,
    ot.name                       AS order_type,
    os.code                       AS order_status_code,
    os.name                       AS order_status_name,
    o.order_date,
    o.status_date,
    o.created_at,
    u_created.firstname           AS created_by_firstname,
    u_created.lastname            AS created_by_lastname,
    o.updated_at,
    u_updated.firstname           AS updated_by_firstname,
    u_updated.lastname            AS updated_by_lastname,
    o.note,
    c.firstname                   AS customer_firstname,
    c.lastname                    AS customer_lastname,
    pm.name                       AS payment_method,
    ps.name                       AS payment_status_name,
    ps.code                       AS payment_status_code,
    dm.method_name                AS delivery_method,
    (
      SELECT COUNT(*)
      FROM order_items oi
      WHERE oi.order_id = o.id
    )                             AS number_of_items
  FROM ${ORDER_PAGINATED_TABLE}
  ${_ORDER_PAGINATED_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Find By ID (full detail) ─────────────────────────────────────────────────

// $1: order_id (UUID)
const ORDER_FIND_BY_ID_QUERY = `
  SELECT
    o.id                          AS order_id,
    o.order_number,
    o.order_date,
    o.status_date,
    o.note,
    o.order_type_id,
    ot.name                       AS order_type_name,
    o.order_status_id,
    os.name                       AS order_status_name,
    os.code                       AS order_status_code,
    so.customer_id,
    c.firstname                   AS customer_firstname,
    c.lastname                    AS customer_lastname,
    (c.firstname || ' ' || c.lastname) AS customer_full_name,
    c.email                       AS customer_email,
    c.phone_number                AS customer_phone,
    so.payment_status_id,
    ps.name                       AS payment_status_name,
    ps.code                       AS payment_status_code,
    so.payment_method_id,
    pmeth.name                    AS payment_method_name,
    so.currency_code,
    so.exchange_rate,
    so.base_currency_amount,
    so.discount_id,
    d.name                        AS discount_name,
    d.discount_type,
    d.discount_value,
    so.discount_amount,
    so.subtotal,
    so.tax_rate_id,
    tr.name                       AS tax_rate_name,
    tr.region                     AS tax_rate_region,
    tr.rate                       AS tax_rate_percent,
    tr.province                   AS tax_rate_province,
    so.tax_amount,
    so.shipping_fee,
    so.total_amount,
    so.delivery_method_id,
    dm.method_name                AS delivery_method_name,
    so.metadata                   AS sales_order_metadata,
    o.shipping_address_id,
    ship.customer_id              AS shipping_customer_id,
    ship.full_name                AS shipping_full_name,
    ship.phone                    AS shipping_phone,
    ship.email                    AS shipping_email,
    ship.label                    AS shipping_label,
    ship.address_line1            AS shipping_address_line1,
    ship.address_line2            AS shipping_address_line2,
    ship.city                     AS shipping_city,
    ship.state                    AS shipping_state,
    ship.postal_code              AS shipping_postal_code,
    ship.country                  AS shipping_country,
    ship.region                   AS shipping_region,
    o.billing_address_id,
    bill.customer_id              AS billing_customer_id,
    bill.full_name                AS billing_full_name,
    bill.phone                    AS billing_phone,
    bill.email                    AS billing_email,
    bill.label                    AS billing_label,
    bill.address_line1            AS billing_address_line1,
    bill.address_line2            AS billing_address_line2,
    bill.city                     AS billing_city,
    bill.state                    AS billing_state,
    bill.postal_code              AS billing_postal_code,
    bill.country                  AS billing_country,
    bill.region                   AS billing_region,
    o.created_at                  AS order_created_at,
    o.updated_at                  AS order_updated_at,
    o.created_by                  AS order_created_by,
    ucb.firstname                 AS order_created_by_firstname,
    ucb.lastname                  AS order_created_by_lastname,
    o.updated_by                  AS order_updated_by,
    uub.firstname                 AS order_updated_by_firstname,
    uub.lastname                  AS order_updated_by_lastname
  FROM orders o
  LEFT JOIN sales_orders      so    ON so.id    = o.id
  LEFT JOIN order_types       ot    ON ot.id    = o.order_type_id
  LEFT JOIN order_status      os    ON os.id    = o.order_status_id
  LEFT JOIN customers         c     ON c.id     = so.customer_id
  LEFT JOIN payment_status    ps    ON ps.id    = so.payment_status_id
  LEFT JOIN payment_methods   pmeth ON pmeth.id = so.payment_method_id
  LEFT JOIN discounts         d     ON d.id     = so.discount_id
  LEFT JOIN tax_rates         tr    ON tr.id    = so.tax_rate_id
  LEFT JOIN delivery_methods  dm    ON dm.id    = so.delivery_method_id
  LEFT JOIN addresses         ship  ON ship.id  = o.shipping_address_id
  LEFT JOIN addresses         bill  ON bill.id  = o.billing_address_id
  LEFT JOIN users             ucb   ON ucb.id   = o.created_by
  LEFT JOIN users             uub   ON uub.id   = o.updated_by
  WHERE o.id = $1
`;

// ─── Metadata ─────────────────────────────────────────────────────────────────

// Lightweight fetch for status/type resolution in service flows.
// $1: order_id (UUID)
const ORDER_FETCH_METADATA_QUERY = `
  SELECT
    o.id                          AS order_id,
    o.order_status_id,
    s.category                    AS order_status_category,
    s.code                        AS order_status_code,
    s.name                        AS order_status_name,
    o.order_type_id,
    ot.code                       AS order_type_code,
    ot.name                       AS order_type_name,
    ot.category                   AS order_category,
    ps.code                       AS payment_code
  FROM orders o
  JOIN sales_orders   so ON o.id              = so.id
  JOIN payment_status ps ON so.payment_status_id = ps.id
  JOIN order_types    ot ON o.order_type_id   = ot.id
  JOIN order_status   s  ON o.order_status_id = s.id
  WHERE o.id = $1
`;

// ─── Update Status ────────────────────────────────────────────────────────────

// Skips update if status already matches — IS DISTINCT FROM prevents no-op writes.
// $1: new_status_id, $2: updated_by, $3: order_id
const ORDER_UPDATE_STATUS_QUERY = `
  UPDATE orders
  SET
    order_status_id = $1,
    status_date     = NOW(),
    updated_at      = NOW(),
    updated_by      = $2
  WHERE id = $3
    AND order_status_id IS DISTINCT FROM $1
  RETURNING id, order_status_id, status_date
`;

// ─── Allocations By Order ─────────────────────────────────────────────────────

// $1: order_id (UUID)
const ORDER_GET_ALLOCATIONS_QUERY = `
  SELECT
    ia.id                         AS allocation_id,
    ia.order_item_id,
    ia.warehouse_id,
    ia.batch_id,
    ia.allocated_quantity
  FROM orders o
  JOIN order_items oi              ON oi.order_id       = o.id
  JOIN inventory_allocations ia    ON ia.order_item_id  = oi.id
  WHERE o.id = $1
`;

// ─── Shipment Metadata ────────────────────────────────────────────────────────

// $1: order_id (UUID)
const ORDER_GET_SHIPMENT_METADATA_QUERY = `
  SELECT
    o.order_number,
    so.id                         AS sales_order_id,
    so.delivery_method_id,
    ARRAY_AGG(oi.id)              AS order_item_ids
  FROM sales_orders so
  JOIN orders o                   ON so.id    = o.id
  JOIN order_items oi             ON oi.order_id = o.id
  WHERE o.id = $1
  GROUP BY o.order_number, so.id, so.delivery_method_id
`;

module.exports = {
  ORDER_INSERT_QUERY,
  ORDER_PAGINATED_TABLE,
  ORDER_PAGINATED_JOINS,
  ORDER_PAGINATED_SORT_WHITELIST,
  buildOrderPaginatedQuery,
  ORDER_FIND_BY_ID_QUERY,
  ORDER_FETCH_METADATA_QUERY,
  ORDER_UPDATE_STATUS_QUERY,
  ORDER_GET_ALLOCATIONS_QUERY,
  ORDER_GET_SHIPMENT_METADATA_QUERY,
};
