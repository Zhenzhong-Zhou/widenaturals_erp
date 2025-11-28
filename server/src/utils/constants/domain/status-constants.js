const INVENTORY_STATUS = {
  IN_STOCK: 'inventory_in_stock',
  OUT_OF_STOCK: 'inventory_out_of_stock',
  UNASSIGNED: 'inventory_unassigned',
};

const STATUS_CONSTANTS = {
  PERMISSIONS: {
    VIEW_ALL_STATUSES: 'view_all_statuses',
    // User can view all statuses regardless of active/inactive state
    
    VIEW_ACTIVE_STATUSES: 'view_active_statuses',
    // User can only view active statuses (default-limited visibility)
    
    ADMIN_OVERRIDE_STATUS_FILTERS: 'admin_override_status_filters',
    // Full bypass of status filter constraints (admin or system-level)
  },
};

module.exports = {
  INVENTORY_STATUS,
  STATUS_CONSTANTS,
};
