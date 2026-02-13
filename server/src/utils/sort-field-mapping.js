/**
 * Maps frontend sort keys to fully qualified SQL fields,
 * organized by table/module for reuse across service and repository layers.
 */
const SORTABLE_FIELDS = {
  userSortMap: {
    // ----------------------------
    // Identity
    // ----------------------------
    fullName: `LOWER(COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, ''))`,
    firstname: `LOWER(u.firstname)`,
    lastname: `LOWER(u.lastname)`,
    email: `LOWER(u.email)`,

    // ----------------------------
    // Role / Status
    // ----------------------------
    roleName: `LOWER(r.name)`,
    statusName: `LOWER(s.name)`,

    // ----------------------------
    // Job / Contact
    // ----------------------------
    jobTitle: `LOWER(u.job_title)`,
    phoneNumber: `u.phone_number`,

    // ----------------------------
    // Audit
    // ----------------------------
    createdAt: `u.created_at`,
    updatedAt: `u.updated_at`,

    // ----------------------------
    // Fallback
    // ----------------------------
    defaultNaturalSort: `u.created_at`,
  },
  productSortMap: {
    // Product-level fields (FROM products p)
    productName: 'p.name',
    series: 'p.series',
    brand: 'p.brand',
    category: 'p.category',
    description: 'p.description',

    // Status-level fields (FROM status s)
    statusName: 's.name',
    statusId: 'p.status_id',
    statusDate: 'p.status_date',

    // Audit timestamps (FROM products p)
    createdAt: 'p.created_at',
    updatedAt: 'p.updated_at',

    // Audit user fields (FROM users cu/uu)
    createdByFirstName: 'cu.firstname',
    createdByLastName: 'cu.lastname',
    updatedByFirstName: 'uu.firstname',
    updatedByLastName: 'uu.lastname',

    // Default fallback
    defaultNaturalSort: 'p.created_at',
  },
  skuSortMap: {
    // ---- SKU-level fields ----
    skuCode: 's.sku',
    barcode: 's.barcode',
    language: 's.language',
    countryCode: 's.country_code',
    marketRegion: 's.market_region',
    sizeLabel: 's.size_label',

    // ---- Product-level fields ----
    productName: 'p.name',
    productSeries: 'p.series',
    brand: 'p.brand',
    category: 'p.category',

    // ---- Status fields ----
    statusName: 'st.name',
    statusDate: 's.status_date',

    // ---- Dates ----
    createdAt: 's.created_at',
    updatedAt: 's.updated_at',

    // ---- Default fallback ----
    defaultNaturalSort: 's.created_at',
  },
  complianceRecordSortMap: {
    createdAt: 'cr.created_at',
    updatedAt: 'cr.updated_at',
    issuedDate: 'cr.issued_date',
    expiryDate: 'cr.expiry_date',
    complianceNumber: 'cr.compliance_id',
    productName: 'p.name',
    skuCode: 's.sku',
    status: 'cr.status_id',

    // keep sorting consistent and safe
    defaultNaturalSort: 'cr.created_at',
  },
  bomSortMap: {
    // --- Product / SKU level ---
    productName: 'p.name',
    brand: 'p.brand',
    series: 'p.series',
    category: 'p.category',
    skuCode: 's.sku',
    marketRegion: 's.market_region',
    sizeLabel: 's.size_label',

    // --- Compliance level ---
    complianceType: 'c.type',
    complianceStatus: 'st_compliance.name',
    complianceIssuedDate: 'c.issued_date',
    complianceExpiryDate: 'c.expiry_date',

    // --- BOM level ---
    bomCode: 'b.code',
    bomName: 'b.name',
    revision: 'b.revision',
    isActive: 'b.is_active',
    isDefault: 'b.is_default',
    bomStatus: 'st_bom.name',
    bomStatusDate: 'b.status_date',

    // --- Audit fields ---
    createdAt: 'b.created_at',
    updatedAt: 'b.updated_at',
    createdBy: 'cu.firstname',
    updatedBy: 'uu.firstname',

    // --- Complex / synthetic sorting ---
    defaultNaturalSort: `
      p.name ASC,
      s.sku ASC,
      b.is_default DESC,
      b.is_active DESC,
      b.revision DESC,
      b.created_at DESC
    `,
  },
  skuProductCards: {
    brand: 'p.brand',
    category: 'p.category',
    marketRegion: 's.market_region',
    sizeLabel: 's.size_label',
    createdAt: 's.created_at',
    complianceNumber: 'cr.compliance_id',
    defaultNaturalSort: `
      p.name,
      s.created_at
    `,
  },
  batchRegistrySortMap: {
    // --------------------------------------------------
    // Core registry identity (SAFE, always present)
    // --------------------------------------------------
    registeredAt: `br.registered_at`,
    batchType: `br.batch_type`,
    
    // --------------------------------------------------
    // Lot number (polymorphic)
    // --------------------------------------------------
    lotNumber: `
      LOWER(
        COALESCE(pb.lot_number, pmb.lot_number)
      )
    `,
    
    // --------------------------------------------------
    // Expiry date (polymorphic, NULL-safe)
    // --------------------------------------------------
    expiryDate: `
      COALESCE(pb.expiry_date, pmb.expiry_date)
    `,
    
    // --------------------------------------------------
    // Status (polymorphic)
    // --------------------------------------------------
    statusName: `
      LOWER(
        COALESCE(bs_pb.name, bs_pmb.name)
      )
    `,
    
    statusDate: `
      COALESCE(pb.status_date, pmb.status_date)
    `,
    
    // --------------------------------------------------
    // Product-side metadata
    // --------------------------------------------------
    productName: `LOWER(p.name)`,
    skuCode: `LOWER(s.sku)`,
    manufacturerName: `LOWER(m.name)`,
    
    // --------------------------------------------------
    // Packaging-side metadata
    // --------------------------------------------------
    packagingMaterialName: `LOWER(pm.name)`,
    supplierName: `LOWER(sup.name)`,
    
    // --------------------------------------------------
    // Audit
    // --------------------------------------------------
    registeredBy: `
      LOWER(
        COALESCE(u_reg.firstname, '') || ' ' ||
        COALESCE(u_reg.lastname, '')
      )
    `,
    
    // --------------------------------------------------
    // Fallback (required)
    // --------------------------------------------------
    defaultNaturalSort: `br.registered_at`,
  },
  productBatchSortMap: {
    // --------------------------------------------------
    // Core identity (SAFE, always present)
    // --------------------------------------------------
    createdAt: `pb.created_at`,
    lotNumber: `LOWER(pb.lot_number)`,
    
    // --------------------------------------------------
    // SKU (PRIMARY operational identity)
    // --------------------------------------------------
    skuCode: `LOWER(sk.sku)`,
    sizeLabel: `LOWER(sk.size_label)`,
    countryCode: `LOWER(sk.country_code)`,
    
    // --------------------------------------------------
    // Product (PRIMARY display fields)
    // --------------------------------------------------
    productName: `LOWER(p.name)`,
    productBrand: `LOWER(p.brand)`,
    productCategory: `LOWER(p.category)`,
    
    // --------------------------------------------------
    // Manufacturer (REFERENCE, permission-gated)
    // --------------------------------------------------
    manufacturerName: `LOWER(m.name)`,
    
    // --------------------------------------------------
    // Lifecycle
    // --------------------------------------------------
    manufactureDate: `pb.manufacture_date`,
    expiryDate: `pb.expiry_date`,
    receivedDate: `pb.received_date`,
    
    // --------------------------------------------------
    // Quantity (manufactured amount)
    // --------------------------------------------------
    initialQuantity: `pb.initial_quantity`,
    
    // --------------------------------------------------
    // Status
    // --------------------------------------------------
    statusName: `LOWER(bs.name)`,
    statusDate: `pb.status_date`,
    
    // --------------------------------------------------
    // Release / approval
    // --------------------------------------------------
    releasedAt: `pb.released_at`,
    releasedBy: `
      LOWER(
        COALESCE(rb.firstname, '') || ' ' ||
        COALESCE(rb.lastname, '')
      )
    `,
    
    // --------------------------------------------------
    // Audit
    // --------------------------------------------------
    updatedAt: `pb.updated_at`,
    
    // --------------------------------------------------
    // Fallback (REQUIRED)
    // --------------------------------------------------
    defaultNaturalSort: `pb.created_at`,
  },
  packagingMaterialBatchSortMap: {
    // --------------------------------------------------
    // Core identity (SAFE, always present)
    // --------------------------------------------------
    receivedAt: `pmb.received_at`,
    lotNumber: `LOWER(pmb.lot_number)`,
    
    // --------------------------------------------------
    // Snapshot identity (PRIMARY display fields)
    // --------------------------------------------------
    materialInternalName: `
      LOWER(pmb.material_snapshot_name)
    `,
    
    supplierLabelName: `
      LOWER(pmb.received_label_name)
    `,
    
    // --------------------------------------------------
    // Lifecycle
    // --------------------------------------------------
    manufactureDate: `pmb.manufacture_date`,
    expiryDate: `pmb.expiry_date`,
    
    // --------------------------------------------------
    // Status
    // --------------------------------------------------
    statusName: `LOWER(bs.name)`,
    statusDate: `pmb.status_date`,
    
    // --------------------------------------------------
    // Quantity
    // --------------------------------------------------
    quantity: `pmb.quantity`,
    
    // --------------------------------------------------
    // Packaging material (REFERENCE ONLY)
    // --------------------------------------------------
    packagingMaterialCode: `LOWER(pm.code)`,
    packagingMaterialCategory: `LOWER(pm.category)`,
    
    // --------------------------------------------------
    // Supplier
    // --------------------------------------------------
    supplierName: `LOWER(s.name)`,
    isPreferredSupplier: `pms.is_preferred`,
    supplierLeadTime: `pms.lead_time_days`,
    
    // --------------------------------------------------
    // Audit / Intake
    // --------------------------------------------------
    receivedBy: `
      LOWER(
        COALESCE(rb.firstname, '') || ' ' ||
        COALESCE(rb.lastname, '')
      )
    `,
    
    createdAt: `pmb.created_at`,
    
    // --------------------------------------------------
    // Fallback (REQUIRED)
    // --------------------------------------------------
    defaultNaturalSort: `pmb.received_at`,
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
        WHEN br.batch_type = 'product' AND p.name ILIKE 'NMN%' THEN
          LPAD(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), 10, '0')
        WHEN br.batch_type = 'product' THEN
          p.name
        ELSE
          LPAD(REGEXP_REPLACE(COALESCE(pmb.material_snapshot_name, pt.name), '[^0-9]', '', 'g'), 20, '0')
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
        WHEN br.batch_type = 'product' AND p.name ILIKE 'NMN%' THEN
          LPAD(REGEXP_REPLACE(p.name, '[^0-9]', '', 'g'), 10, '0')
        WHEN br.batch_type = 'product' THEN
          p.name
        ELSE
          LPAD(REGEXP_REPLACE(COALESCE(pmb.material_snapshot_name, pt.name), '[^0-9]', '', 'g'), 20, '0')
      END NULLS LAST,
      wi.last_update DESC
    `,
  },
  inventoryActivityLogSortMap: {
    actionTimestamp: 'ial.action_timestamp',
    quantityChange: 'ial.quantity_change',
    previousQuantity: 'ial.previous_quantity',
    newQuantity: 'ial.new_quantity',
    sourceType: 'ial.source_type',
    batchType: 'br.batch_type',

    // Action + Adjustment
    actionType: 'iat.name',
    adjustmentType: 'lat.name',

    // Performed by
    performedBy: `(u.firstname || ' ' || u.lastname)`,

    // Product & Material Info
    productName: 'p.name',
    productBrand: 'p.brand',
    sku: 's.sku',
    sizeLabel: 's.size_label',
    countryCode: 's.country_code',
    productLotNumber: 'pb.lot_number',
    productExpiryDate: 'pb.expiry_date',
    materialLotNumber: 'pmb.lot_number',
    materialExpiryDate: 'pmb.expiry_date',
    materialName: 'pmb.material_snapshot_name',

    // Order Info
    orderNumber: 'o.order_number',
    orderType: 'ot.name',
    orderStatus: 'os.name',

    // Warehouse & Location
    warehouseName: 'wh.name',
    locationName: 'loc.name',

    // Fallback default
    defaultNaturalSort: 'ial.action_timestamp DESC',
  },
  customerSortMap: {
    customerName: `
      COALESCE(TRIM(c.firstname || ' ' || c.lastname), '')
    `,
    email: 'c.email',
    phoneNumber: 'c.phone_number',
    status: 's.name',
    hasAddress: `
      EXISTS (
        SELECT 1 FROM addresses a WHERE a.customer_id = c.id
      )
    `,
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
    createdAt: 'a.created_at', // Standard default sort
    updatedAt: 'a.updated_at', // For recently modified addresses

    city: 'a.city',
    state: 'a.state',
    postalCode: 'a.postal_code',
    country: 'a.country',
    region: 'a.region',

    label: 'a.label', // Often used for identifying purpose (e.g. "Shipping", "Billing")
    recipientName: 'a.full_name', // Useful for sorting by recipient
    email: 'a.email', // In the case of email-based workflows
    phone: 'a.phone', // Rare, but could be useful

    customerName: 'c.firstname',
    customerEmail: 'c.email',
  },
  orderTypeSortMap: {
    name: 'ot.name',
    code: 'ot.code',
    category: 'ot.category',
    requiresPayment: 'ot.requires_payment',
    description: 'ot.description',

    statusName: 's.name',
    statusDate: 'ot.status_date',

    createdAt: 'ot.created_at',
    updatedAt: 'ot.updated_at',

    createdBy: 'u1.firstname', // or concat name if joined properly
    updatedBy: 'u2.firstname',

    defaultNaturalSort: 'a.created_at',
  },
  orderSortMap: {
    orderNumber: 'o.order_number',
    orderDate: 'o.order_date',

    // Order Type
    orderType: 'ot.name',

    // Status
    statusName: 'os.name',
    statusDate: 'o.status_date',

    // Audit fields
    createdAt: 'o.created_at',
    updatedAt: 'o.updated_at',
    createdBy: 'u1.firstname',
    updatedBy: 'u2.firstname',

    // Default fallback sort
    defaultNaturalSort: 'o.created_at',
  },
  inventoryAllocationSortMap: {
    // Allocation-level summary fields (FROM alloc_agg aa)
    allocationStatus: 'aa.allocation_summary_status', // derived field
    allocationStatusCodes: 'aa.allocation_status_codes', // raw code array
    allocationStatuses: 'aa.allocation_statuses', // raw label string
    allocatedAt: 'aa.allocated_at',
    allocatedCreatedAt: 'aa.allocated_created_at',

    // Warehouse display info (FROM alloc_agg aa)
    warehouseNames: 'aa.warehouse_names',

    // Order-level fields (FROM orders o)
    orderNumber: 'o.order_number',
    orderDate: 'o.created_at',
    orderType: 'ot.name',
    orderStatus: 'os.name',
    orderStatusDate: 'o.status_date',

    // Customer
    customerName: `c.firstname`, // or use a concat if you have a full name
    customerFirstName: 'c.firstname',
    customerLastName: 'c.lastname',

    // Payment-related
    paymentMethod: 'pm.name',
    paymentStatus: 'ps.name',
    deliveryMethod: 'dm.method_name',

    // Audit fields
    orderCreatedAt: 'o.created_at',
    orderUpdatedAt: 'o.updated_at', // not selected, optional
    orderCreatedByFirstName: 'u.firstname',
    orderCreatedByLastName: 'u.lastname',

    // Item counts
    totalItems: 'ic.total_items',
    allocatedItems: 'aa.allocated_items',

    // Fallback default
    defaultNaturalSort: 'o.created_at',
  },
  outboundShipmentSortMap: {
    // Shipment-level fields (FROM outbound_shipments os)
    shipmentId: 'os.id',
    shipmentStatus: 'ss.name',
    shipmentStatusCode: 'ss.code',
    shippedAt: 'os.shipped_at',
    expectedDeliveryDate: 'os.expected_delivery_date',
    createdAt: 'os.created_at',
    updatedAt: 'os.updated_at',

    // Order-level fields (FROM orders o)
    orderId: 'os.order_id',
    orderNumber: 'o.order_number',

    // Warehouse-level fields (FROM warehouses w)
    warehouseName: 'w.name',

    // Delivery method (FROM delivery_methods dm)
    deliveryMethod: 'dm.method_name',

    // Tracking info (FROM tracking_numbers tn)
    trackingNumber: 'tn.tracking_number',

    // Audit fields (FROM users u1/u2)
    createdByFirstName: 'u1.firstname',
    createdByLastName: 'u1.lastname',
    updatedByFirstName: 'u2.firstname',
    updatedByLastName: 'u2.lastname',

    // Default fallback
    defaultNaturalSort: 'os.created_at',
  },
};

module.exports = {
  SORTABLE_FIELDS,
};
