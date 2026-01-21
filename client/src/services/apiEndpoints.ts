export const API_ENDPOINTS = {
  SECURITY: {
    CSRF: {
      TOKEN: '/csrf/token',
    },
    SESSION: {
      LOGIN: '/session/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/session/refresh',
    },
    AUTH: {
      CHANGE_PASSWORD: '/auth/change-password',
    },
    PERMISSIONS: {
      SELF: '/users/me/permissions',
    },
  },
  PUBLIC: {
    HEALTH: '/public/health',
  },
  USER_PERMISSION: '/users/me/permissions',
  REFRESH_TOKEN: '/session/refresh',
  USERS: {
    ADD_NEW_RECORD: '/users',
    ALL_RECORDS: '/users',
    PROFILE: {
      SELF: '/users/me/profile',
      BY_ID: (userId: string) => `/users/${userId}/profile`,
    },
  },
  STATUSES: {},
  COMPLIANCE_RECORDS: {
    ALL_RECORDS: '/compliance-records',
  },
  PRICING_TYPES: '/pricing-types',
  PRICING_TYPE_METADATA: '/pricing-types/metadata/:id',
  PRICING_LIST: '/pricings',
  PRICING_LIST_EXPORT: '/pricings/export',
  PRICING_DETAILS_BY_TYPE: '/pricings/by-type/:id/details',
  ALL_LOCATION_TYPES: '/location-types',
  LOCATION_TYPE_DETAILS: '/location-types/:id',
  LOCATIONS: {
    ALL_RECORDS: '/locations',
  },
  PRODUCTS: {
    ADD_NEW_RECORD: '/products/create',
    ALL_RECORDS: '/products',
    PRODUCT_DETAILS: (productId: string) => `/products/${productId}/details`,
    UPDATE_INFO: (productId: string) => `/products/${productId}/info`,
    UPDATE_STATUS: (productId: string) => `/products/${productId}/status`,
  },
  SKUS: {
    SKU_PRODUCT_CARDS: '/skus/cards',
    SKU_DETAILS: (skuId: string) => `/skus/${skuId}/details`,
    ALL_RECORDS: '/skus',
    ADD_NEW_RECORD: '/skus/create',
    UPDATE_STATUS: (skuId: string) => `/skus/${skuId}/status`,
  },
  SKU_IMAGES: {
    UPLOAD_IMAGES: '/sku-images/upload',
  },
  BOMS: {
    ALL_RECORDS: '/boms',
    BOM_DETAILS: (bomId: string) => `/boms/${bomId}/details`,
    BOM_MATERIAL_SUPPLY_DETAILS: (bomId: string) =>
      `/bom-items/${bomId}/material-supply`,
    BOM_PRODUCTION_SUMMARY: (bomId: string) =>
      `/boms/${bomId}/production-summary`,
  },
  BATCH_REGISTRY: {
    ALL_RECORDS: '/batch-registry',
  },
  LOCATION_INVENTORY: {
    ALL_RECORDS: '/location-inventory',
    KPI_SUMMARY: '/location-inventory/kpi-summary',
    SUMMARY: '/location-inventory/summary',
    SUMMARY_DETAIL: (itemId: string) =>
      `/location-inventory/summary/${itemId}/details`,
  },
  WAREHOUSES: {
    ALL_RECORDS: '/warehouses',
    WAREHOUSE_DETAILS: (warehouseId: string) =>
      `/warehouses/${warehouseId}/details`,
  },
  WAREHOUSE_INVENTORY: {
    ALL_RECORDS: '/warehouse-inventory',
    SUMMARY: '/warehouse-inventory/summary',
    SUMMARY_DETAIL: (itemId: string) =>
      `/warehouse-inventory/summary/${itemId}/details`,
    ADD_RECORDS: '/warehouse-inventory',
    ADJUST_QUANTITIES: '/warehouse-inventory/adjust-quantities',
  },
  LOOKUPS: {
    BATCH_REGISTRY: '/lookups/batch-registry',
    WAREHOUSES: '/lookups/warehouses',
    LOT_ADJUSTMENT_TYPES: '/lookups/lot-adjustment-types',
    CUSTOMERS: '/lookups/customers',
    ADDRESSES_BY_CUSTOMER: '/lookups/addresses/by-customer',
    ORDER_TYPES: '/lookups/order-types',
    PAYMENT_METHODS: '/lookups/payment-methods',
    DISCOUNTS: '/lookups/discounts',
    TAX_RATES: '/lookups/tax-rates',
    DELIVERY_METHODS: '/lookups/delivery-methods',
    SKUS: '/lookups/skus',
    PRICING: '/lookups/pricing',
    PACKAGING_MATERIALS: '/lookups/packaging-materials',
    SKU_CODE_BASES: '/lookups/sku-code-bases',
    PRODUCTS: '/lookups/products',
    STATUSES: '/lookups/statuses',
    USERS: '/lookups/users',
    ROLES: '/lookups/roles',
  },
  REPORTS: {
    INVENTORY_ACTIVITY_LOGS: 'reports/inventory-activity-logs',
  },
  ORDER_TYPES: {
    ALL_RECORDS: '/order-types',
  },
  CUSTOMERS: {
    ADD_NEW_CUSTOMERS: '/customers/add-new-customers',
    ALL_CUSTOMERS: '/customers',
    CUSTOMER_DETAILS: '/customers/:id',
  },
  ADDRESSES: {
    ADD_NEW_ADDRESSES: '/addresses/add-new-addresses',
    ALL_RECORDS: '/addresses',
  },
  ORDERS: {
    ADD_NEW_ORDER: (category: string) => `/orders/create/${category}`,
    ALL_CATEGORY_ORDERS: (category: string) => `/orders/${category}`,
    ORDER_DETAILS: (category: string, orderId: string) =>
      `/orders/${category}/${orderId}`,
    ORDER_STATUS_UPDATE_PATH: (category: string, orderId: string) =>
      `/orders/${category}/${orderId}/status`,
  },
  INVENTORY_ALLOCATIONS: {
    ALLOCATE_ORDER: (orderId: string) =>
      `/inventory-allocations/allocate/${orderId}`,
    REVIEW_ALLOCATION: (orderId: string) =>
      `/inventory-allocations/review/${orderId}`,
    ALL_ALLOCATIONS: '/inventory-allocations',
    CONFIRM_ALLOCATION: (orderId: string) =>
      `/inventory-allocations/confirm/${orderId}`,
  },
  OUTBOUND_FULFILLMENTS: {
    INITIATE_FULFILLMENT: (orderId: string) =>
      `/outbound-fulfillments/orders/${orderId}/fulfillment/initiate`,
    ALL_RECORDS: '/outbound-fulfillments',
    OUTBOUND_SHIPMENT_DETAILS: (shipmentId: string) =>
      `/outbound-fulfillments/${shipmentId}/details`,
    CONFIRM_FULFILLMENT: (orderId: string) =>
      `/outbound-fulfillments/orders/${orderId}/fulfillment/confirm`,
    COMPLETE_MANUAL_FULFILLMENT: (shipmentId: string) =>
      `/outbound-fulfillments/manual/${shipmentId}/complete`,
  },
};
