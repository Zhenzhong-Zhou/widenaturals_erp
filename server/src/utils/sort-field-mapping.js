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
  customerSortMap: {
    customerName: `
    COALESCE(TRIM(c.firstname || ' ' || c.lastname), '')
  `,
    email: 'c.email',
    phoneNumber: 'c.phone_number',
    region: 'c.region',
    country: 'c.country',
    status: 's.name', // joined via status s ON c.status_id = s.id
    createdAt: 'c.created_at',
    updatedAt: 'c.updated_at',
    createdBy: `
    COALESCE(TRIM(u1.firstname || ' ' || u1.lastname), '')
  `,
    updatedBy: `
    COALESCE(TRIM(u2.firstname || ' ' || u2.lastname), '')
  `,
    defaultNaturalSort: `
    c.region,
    s.name,
    COALESCE(TRIM(c.firstname || ' ' || c.lastname), ''),
    c.created_at DESC
  `,
  },
  addressSortMap: {
    created_at: 'a.created_at',        // Standard default sort
    updated_at: 'a.updated_at',        // For recently modified addresses
    
    city: 'a.city',
    state: 'a.state',
    postal_code: 'a.postal_code',
    country: 'a.country',
    region: 'a.region',
    
    label: 'a.label',                  // Often used for identifying purpose (e.g. "Shipping", "Billing")
    recipient_name: 'a.full_name',     // Useful for sorting by recipient
    email: 'a.email',                  // In the case of email-based workflows
    phone: 'a.phone',                  // Rare, but could be useful
    
    customer_name: 'c.firstname',
    customer_email: 'c.email',
  },
};

module.exports = {
  SORTABLE_FIELDS,
};
