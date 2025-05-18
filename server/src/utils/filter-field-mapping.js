/**
 * Maps frontend filter keys to fully qualified SQL fields,
 * organized by table/module for reuse across service and repository layers.
 */
const FILTERABLE_FIELDS = {
  skuProductCards: {
    brand: 'p.brand',
    category: 'p.category',
    marketRegion: 'sku.market_region',
    sizeLabel: 'sku.size_label',
    keyword: 'p.name',
    createdAt: 'sku.created_at',
  },
  pricingRecords: {
    productName: 'pr.name',
    brand: 'pr.brand',
    category: 'pr.category',
    sku: 's.sku',
    countryCode: 's.country_code',
    sizeLabel: 's.size_label',
    pricingType: 'pt.name',
    marketRegion: 's.market_region',
    price: 'p.price',
    validFrom: 'p.valid_from',
    validTo: 'p.valid_to',
  },
  locationInventorySummarySortMap: {
    lotNumber: `
      CASE
        WHEN br.batch_type = 'product' THEN pb.lot_number
        WHEN br.batch_type = 'packaging_material' THEN pmb.lot_number
        ELSE NULL
      END
    `,
    sku: 's.sku',
    productName: 'p.name',
    materialName: 'pm.name',
    inboundDate: 'li.inbound_date',
    expiryDate: `
      CASE
        WHEN br.batch_type = 'product' THEN pb.expiry_date
        WHEN br.batch_type = 'packaging_material' THEN pmb.expiry_date
        ELSE NULL
      END
    `,
    status: 's_status.name',
    locationQuantity: 'li.location_quantity',
    reservedQuantity: 'li.reserved_quantity',
    availableQuantity: '(li.location_quantity - li.reserved_quantity)',
    createdAt: 'created_at',
  },
};

module.exports = {
  FILTERABLE_FIELDS,
};
