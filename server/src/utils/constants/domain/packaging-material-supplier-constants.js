const PACKAGING_MATERIAL_SUPPLIER_CONSTANTS = {
  PERMISSIONS: {
    VIEW_ALL_PACKAGING_MATERIAL_SUPPLIERS:
      'view_all_packaging_material_suppliers',
    // Can view all packaging material supplier relationships
    // regardless of supplier lifecycle status.

    VIEW_ACTIVE_PACKAGING_MATERIAL_SUPPLIERS:
      'view_active_packaging_material_suppliers',
    // Can only view supplier relationships where the supplier
    // has an ACTIVE status.

    VIEW_ARCHIVED_PACKAGING_MATERIAL_SUPPLIERS:
      'view_archived_packaging_material_suppliers',

    ADMIN_OVERRIDE_PACKAGING_MATERIAL_SUPPLIER_FILTERS:
      'admin_override_packaging_material_supplier_filters',
    // Full bypass of supplier lookup filter constraints
    // (admin-level override).
  },
};

module.exports = PACKAGING_MATERIAL_SUPPLIER_CONSTANTS;
