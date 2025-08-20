const PERMISSIONS = {
  ADMIN: {
    MANAGE: 'manage_admin',
    CREATE: 'create_admin',
    DELETE: 'delete_admin',
    VIEW: 'view_admin',
  },
  USERS: {
    MANAGE: 'manage_users',
    DELETE: 'delete_user',
    EDIT: 'edit_profile',
  },
  DASHBOARD: {
    VIEW: 'view_dashboard',
  },
  REPORTS: {
    VIEW: 'view_reports',
  },
  ORDER: {
    CREATE: 'create_orders',
    VIEW: 'view_orders',
    UPDATE_SALES_ORDER_STATUS: 'update_sales_order_status',
  },
};

module.exports = PERMISSIONS;
