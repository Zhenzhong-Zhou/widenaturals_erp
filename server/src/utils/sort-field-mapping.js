/**
 * Maps frontend sort keys to fully qualified SQL fields,
 * organized by table/module for reuse across service and repository layers.
 */
const SORTABLE_FIELDS = {
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
  locationInventorySortMap: {
    locationName: 'loc.name',
    productName: 'p.name',
    materialName: 'pmb.material_snapshot_name',
    inboundDate: 'li.inbound_date',
    outboundDate: 'li.outbound_date',
    expiryDate: `
      CASE
        WHEN br.batch_type = 'product' THEN pb.expiry_date
        WHEN br.batch_type = 'packaging_material' THEN pmb.expiry_date
        ELSE NULL
      END
    `,
    createdAt: 'li.created_at',
    lastUpdate: 'li.last_update',
    availableQuantity: '(li.location_quantity - li.reserved_quantity)',
    status: 'st.name',
    name: `
      CASE
        WHEN br.batch_type = 'product' THEN p.name
        ELSE COALESCE(pmb.material_snapshot_name, pt.name, p.name)
      END
    `,
    defaultNaturalSort: `
      loc.name,
      p.brand,
      br.batch_type,
      CASE
        WHEN br.batch_type = 'product' THEN
          CAST(NULLIF(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), '') AS INTEGER)
        ELSE
          CAST(NULLIF(REGEXP_REPLACE(COALESCE(pmb.material_snapshot_name, pt.name), '[^0-9]', '', 'g'), '') AS INTEGER)
      END NULLS LAST,
      CASE
        WHEN br.batch_type = 'product' THEN
          CAST(NULLIF(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), '') AS INTEGER)
        ELSE NULL
      END NULLS LAST,
      li.last_update DESC
    `,
  },
  warehouseInventorySortMap: {
    warehouseName: 'wh.name',
    productName: 'p.name',
    materialName: 'pmb.material_snapshot_name',
    expiryDate: `
      CASE
        WHEN br.batch_type = 'product' THEN pb.expiry_date
        WHEN br.batch_type = 'packaging_material' THEN pmb.expiry_date
        ELSE NULL
      END
    `,
    createdAt: 'wi.created_at',
    lastUpdate: 'wi.last_update',
    availableQuantity: '(wi.warehouse_quantity - wi.reserved_quantity)',
    status: 'st.name',
    name: `
      CASE
        WHEN br.batch_type = 'product' THEN p.name
        ELSE COALESCE(pmb.material_snapshot_name, pt.name, p.name)
      END
    `,
    defaultNaturalSort: `
      wh.name DESC,
      p.brand,
      br.batch_type,
      CASE
        WHEN br.batch_type = 'product' THEN
          CAST(NULLIF(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), '') AS INTEGER)
        ELSE
          CAST(NULLIF(REGEXP_REPLACE(COALESCE(pmb.material_snapshot_name, pt.name), '[^0-9]', '', 'g'), '') AS INTEGER)
      END NULLS LAST,
      CASE
        WHEN br.batch_type = 'product' THEN
          CAST(NULLIF(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), '') AS INTEGER)
        ELSE NULL
      END NULLS LAST,
      wi.last_update DESC
    `,
  },
};

module.exports = {
  SORTABLE_FIELDS,
};
