const CUSTOMER_CONSTANTS = {
  PERMISSIONS: {
    VIEW_ALL_CUSTOMERS: 'view_all_customers', // Can see all customers regardless of status
    VIEW_ACTIVE_CUSTOMERS: 'view_active_customers', // Can see only active customers
    ADMIN_OVERRIDE_CUSTOMER_FILTERS: 'admin_override_customer_filters', // Full bypass of customer filter constraints
  },
};

module.exports = CUSTOMER_CONSTANTS;
