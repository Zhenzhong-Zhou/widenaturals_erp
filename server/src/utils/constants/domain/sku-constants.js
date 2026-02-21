const SKU_CONSTANTS = {
  PERMISSIONS: {
    VIEW_SKU_INACTIVE: 'view_inactive_sku', // can see inactive/discontinued SKUs
    VIEW_PRODUCT_INACTIVE: 'view_inactive_product', // can see SKUs inside inactive products
    VIEW_SKUS_ALL_STATUSES: 'view_all_statuses_skus', // override: see all SKU + product statuses
    ALLOW_BACKORDER_SKUS: 'allow_backorder_skus', // Allow SKUs with no stock
    ALLOW_INTERNAL_ORDER_SKUS: 'allow_internal_order_skus', // Allow inactive/discontinued SKUs for internal orders
    ADMIN_OVERRIDE_SKU_FILTERS: 'admin_override_sku_filters', // Full bypass of SKU filter constraints
  },
};

const SKU_IMAGES_CONSTANTS = {
  PERMISSIONS: {
    VIEW_IMAGES: 'view_sku_images',
    VIEW_IMAGE_METADATA: 'view_sku_image_metadata',
    VIEW_IMAGE_HISTORY: 'view_sku_image_history',
  },
};

const BARCODE_REGEX = /^[0-9A-Za-z\-._\/ ]{1,64}$/;

const SKU_EDIT_TYPE = {
  METADATA: 'METADATA',
  DIMENSIONS: 'DIMENSIONS',
  IDENTITY: 'IDENTITY'
};

const SKU_EDIT_POLICIES = {
  METADATA: {
    blockArchived: true,
    blockOperational: false,
    blockCommercial: false,
  },
  DIMENSIONS: {
    blockArchived: true,
    blockOperational: true,
    blockCommercial: false,
  },
  IDENTITY: {
    blockArchived: true,
    blockOperational: true,
    blockCommercial: true,
  }
};

module.exports = {
  SKU_CONSTANTS,
  SKU_IMAGES_CONSTANTS,
  BARCODE_REGEX,
  SKU_EDIT_TYPE,
  SKU_EDIT_POLICIES,
};
