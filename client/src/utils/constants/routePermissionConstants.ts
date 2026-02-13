/**
 * ROUTE_PERMISSIONS
 *
 * Centralized mapping of view-level permissions used for route access control.
 *
 * Responsibilities:
 * - Provide a single source of truth for route-related permission keys
 * - Prevent hardcoded string usage inside route definitions
 * - Improve maintainability and refactor safety
 *
 * Scope:
 * - Used by route metadata (`meta.requiredPermission`)
 * - Used by navigation filtering (UI visibility)
 * - Used by PermissionGuard (client-side enforcement)
 *
 * IMPORTANT:
 * - These values MUST match backend permission keys exactly.
 * - This file does NOT enforce security.
 * - Backend middleware remains the authoritative access control layer.
 *
 * Design Principle:
 * - Only VIEW-level permissions belong here.
 * - Action-level permissions (create/update/delete) belong in domain constants.
 */

// ------------------------------------------------------
// View-level permissions only
// Do NOT include create/update/delete permissions here.
// This file gates PAGE ACCESS only.
// ------------------------------------------------------

const ROUTE_PERMISSIONS = {
  USERS: {
    VIEW_LIST: 'view_user_list',
    VIEW_CARD: 'view_user_card',
  },
  PRODUCTS: {
    VIEW: 'view_products',
  },
  SKUS: {
    VIEW_CARDS: 'view_sku_cards',
    VIEW_LIST: 'view_skus',
  },
  PRICING_TYPES: {
    VIEW: 'view_pricing_types',
  },
  PRICING: {
    VIEW: 'view_prices',
  },
  COMPLIANCE_RECORDS: {
    VIEW_LIST: 'view_compliance_records',
  },
  BOMS: {
    VIEW_LIST: 'view_boms',
  },
  LOCATIONS_TYPES: {
    VIEW: 'view_location_types',
  },
  LOCATIONS: {
    VIEW: 'view_locations',
  },
  BATCH_REGISTRY: {
    VIEW_LIST: 'view_batch_registry',
  },
  PRODUCT_BATCH: {
    VIEW_LIST: 'view_product_batches',
  },
  PACKAGING_BATCH: {
    VIEW_LIST: 'view_packaging_material_batches',
  },
  WAREHOUSE_INVENTORY: {
    VIEW: 'view_warehouse_inventory',
    VIEW_SUMMARY: 'view_warehouse_inventory_summary',
    VIEW_SUMMARY_ITEM_DETAILS: 'view_warehouse_inventory_summary_item_details',
  },
  REPORTS: {
    VIEW_INVENTORY_LOGS: 'view_inventory_logs',
  },
  CUSTOMERS: {
    VIEW: 'view_customers',
  },
  ADDRESSES: {
    VIEW: 'view_addresses',
  },
  ORDER_TYPES: {
    VIEW: 'view_order_types',
  },
  ORDERS: {
    VIEW: 'view_orders',
  },
  INVENTORY_ALLOCATION: {
    VIEW: 'view_inventory_allocations',
  },
  OUTBOUND_FULFILLMENTS: {
    VIEW: 'view_outbound_fulfillments',
  },
};

export default ROUTE_PERMISSIONS;
