const LOOKUPS = {
  ADDRESSES: {
    MAX_BY_CUSTOMER: 20,
  },
  PERMISSIONS: {
    VIEW_BATCH_REGISTRY: 'view_batch_registry_lookup',
    VIEW_WAREHOUSE: 'view_warehouse_lookup',
    VIEW_LOT_ADJUSTMENT_TYPE: 'view_lot_adjustment_type_lookup',
    VIEW_CUSTOMER: 'view_customer_lookup',
    VIEW_CUSTOMER_ADDRESS: 'view_customer_address_lookup',
    VIEW_ORDER_TYPE: 'view_order_type_lookup',
    VIEW_PAYMENT_METHOD: 'view_payment_method_lookup',
    VIEW_DISCOUNT: 'view_discount_lookup',
    VIEW_TAX_RATE: 'view_tax_rate_lookup',
    VIEW_DELIVERY_METHOD: 'view_delivery_method_lookup',
    VIEW_SKU: 'view_sku_lookup',
  }
};

module.exports = LOOKUPS;
