'use strict';

const { fetchDynamicValue } = require('../_helpers/utils');

// ────────────────────────────────────────────────────────────────────
// Route-level permissions (nested: PERMISSION_KEYS.DOMAIN.ACTION)
// ────────────────────────────────────────────────────────────────────
const PERMISSION_KEYS = require('../../../utils/constants/domain/permission-keys');

// ────────────────────────────────────────────────────────────────────
// ACL-layer permissions (domain constants, flat PERMISSIONS maps)
// ────────────────────────────────────────────────────────────────────

// Wrapped exports: module.exports = { X }
const {
  BATCH_CONSTANTS,
} = require('../../../utils/constants/domain/batch-constants');
const {
  COMPLIANCE_RECORD_CONSTANTS,
} = require('../../../utils/constants/domain/compliance-record-constants');
const {
  INVENTORY_ACTION_TYPE_CONSTANTS,
} = require('../../../utils/constants/domain/inventory-action-type-constants');
const {
  INVENTORY_ALLOCATION_CONSTANTS,
} = require('../../../utils/constants/domain/inventory-allocation-constants');
const {
  INVENTORY_STATUS_CONSTANTS,
} = require('../../../utils/constants/domain/inventory-status-constants');
const {
  LOCATION_CONSTANTS,
} = require('../../../utils/constants/domain/location-constants');
const {
  LOCATION_TYPE_CONSTANTS,
} = require('../../../utils/constants/domain/location-type-constants');
const {
  LOT_ADJUSTMENT_TYPE_CONSTANTS,
} = require('../../../utils/constants/domain/lot-adjustment-type-constants');
const {
  MANUFACTURER_CONSTANTS,
} = require('../../../utils/constants/domain/manufacturer-constants');
const {
  ROLE_CONSTANTS,
} = require('../../../utils/constants/domain/role-constants');
const {
  SKU_CONSTANTS,
  SKU_IMAGES_CONSTANTS,
} = require('../../../utils/constants/domain/sku-constants');
const {
  STATUS_CONSTANTS,
} = require('../../../utils/constants/domain/status-constants');
const {
  SUPPLIER_CONSTANTS,
} = require('../../../utils/constants/domain/supplier-constants');
const {
  USER_CONSTANTS,
} = require('../../../utils/constants/domain/user-constants');
const {
  WAREHOUSE_CONSTANTS,
} = require('../../../utils/constants/domain/warehouse-constants');
const {
  WAREHOUSE_INVENTORY_CONSTANTS,
} = require('../../../utils/constants/domain/warehouse-inventory-constants');

// Unwrapped exports: module.exports = X
const CUSTOMER_CONSTANTS = require('../../../utils/constants/domain/customer-constants');
const DELIVERY_METHOD_CONSTANTS = require('../../../utils/constants/domain/delivery-method-constants');
const DISCOUNT_CONSTANTS = require('../../../utils/constants/domain/discount-constants');
const LOOKUPS = require('../../../utils/constants/domain/lookup-constants');
const ORDER_CONSTANTS = require('../../../utils/constants/domain/order-constants');
const PACKAGING_MATERIAL_CONSTANTS = require('../../../utils/constants/domain/packaging-material-constants');
const PACKAGING_MATERIAL_SUPPLIER_CONSTANTS = require('../../../utils/constants/domain/packaging-material-supplier-constants');
const PAYMENT_METHOD_CONSTANTS = require('../../../utils/constants/domain/payment-method-constants');
const PRICING_CONSTANTS = require('../../../utils/constants/domain/pricing-constants');
const PRODUCT_CONSTANTS = require('../../../utils/constants/domain/product-constants');
const SKU_CODE_BASE_CONSTANTS = require('../../../utils/constants/domain/sku-code-base-constants');
const TAX_RATE_CONSTANTS = require('../../../utils/constants/domain/tax-rate-constants');

// Order-type module: provides PERMISSIONS map + generators for category perms
const {
  PERMISSIONS: ORDER_CATEGORY_PERMISSIONS,
  GENERIC_ORDER_PERMISSIONS,
  ORDER_CATEGORIES,
  ORDER_TYPE_CONSTANTS,
} = require('../../../utils/constants/domain/order-type-constants');

// ────────────────────────────────────────────────────────────────────
// Registry: every ACL-layer PERMISSIONS map in one place
// ────────────────────────────────────────────────────────────────────
const DOMAIN_PERMISSION_MAPS = [
  BATCH_CONSTANTS.PERMISSIONS,
  COMPLIANCE_RECORD_CONSTANTS.PERMISSIONS,
  CUSTOMER_CONSTANTS.PERMISSIONS,
  DELIVERY_METHOD_CONSTANTS.PERMISSIONS,
  DISCOUNT_CONSTANTS.PERMISSIONS,
  INVENTORY_ACTION_TYPE_CONSTANTS.PERMISSIONS,
  INVENTORY_ALLOCATION_CONSTANTS.PERMISSIONS,
  INVENTORY_STATUS_CONSTANTS.PERMISSIONS,
  LOCATION_CONSTANTS.PERMISSIONS,
  LOCATION_TYPE_CONSTANTS.PERMISSIONS,
  LOOKUPS.PERMISSIONS,
  LOT_ADJUSTMENT_TYPE_CONSTANTS.PERMISSIONS,
  MANUFACTURER_CONSTANTS.PERMISSIONS,
  ORDER_CONSTANTS.PERMISSIONS,
  ORDER_CATEGORY_PERMISSIONS, // generated cross of actions × categories
  GENERIC_ORDER_PERMISSIONS, // view_order / create_order / etc.
  ORDER_TYPE_CONSTANTS.PERMISSIONS,
  PACKAGING_MATERIAL_CONSTANTS.PERMISSIONS,
  PACKAGING_MATERIAL_SUPPLIER_CONSTANTS.PERMISSIONS,
  PAYMENT_METHOD_CONSTANTS.PERMISSIONS,
  PRICING_CONSTANTS.PERMISSIONS,
  PRODUCT_CONSTANTS.PERMISSIONS,
  ROLE_CONSTANTS.PERMISSIONS,
  SKU_CODE_BASE_CONSTANTS.PERMISSIONS,
  SKU_CONSTANTS.PERMISSIONS,
  SKU_IMAGES_CONSTANTS.PERMISSIONS,
  STATUS_CONSTANTS.PERMISSIONS,
  SUPPLIER_CONSTANTS.PERMISSIONS,
  TAX_RATE_CONSTANTS.PERMISSIONS,
  USER_CONSTANTS.PERMISSIONS,
  WAREHOUSE_CONSTANTS.PERMISSIONS,
  WAREHOUSE_INVENTORY_CONSTANTS.PERMISSIONS,
];

// Keys with no domain home
const SPECIAL_PERMISSIONS = ['root_access'];

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Walks a nested object and collects all string leaf values.
 * Used for PERMISSION_KEYS which has shape { DOMAIN: { ACTION: 'key' } }.
 */
const flattenPermissionKeys = (obj) => {
  const out = [];
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      out.push(value);
    } else if (value && typeof value === 'object') {
      out.push(...flattenPermissionKeys(value));
    }
  }
  return out;
};

const toTitleCase = (snake) =>
  snake
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const toDescription = (snake) =>
  `Auto-generated permission for ${snake.replace(/_/g, ' ')}`;

// ────────────────────────────────────────────────────────────────────
// Metadata overrides — hand-written names/descriptions for keys
// that deserve nicer copy than the auto-generated format.
// ────────────────────────────────────────────────────────────────────

const ACTION_META = {
  view: { label: 'View', gerund: 'viewing', plural: true },
  create: { label: 'Create', gerund: 'creating', plural: false },
  update: { label: 'Update', gerund: 'updating', plural: false },
  delete: { label: 'Delete', gerund: 'deleting', plural: false },
};

const METADATA_OVERRIDES = {
  root_access: {
    name: 'Root Access',
    description: 'Grants access to all routes and operations',
  },
};

// Populate order-category overrides (Allows viewing sales orders, etc.)
for (const category of ORDER_CATEGORIES) {
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

  for (const action of Object.values(GENERIC_ORDER_PERMISSIONS)) {
    const verb = action.split('_')[0];
    const meta = ACTION_META[verb] || {
      label: verb,
      gerund: `${verb}ing`,
      plural: true,
    };
    const key = `${verb}_${category}_order`;

    METADATA_OVERRIDES[key] = {
      name: `${meta.label} ${meta.plural ? `${displayCategory} Orders` : `${displayCategory} Order`}`,
      description: `Allows ${meta.gerund} ${meta.plural ? `${category} orders` : `a ${category} order`}`,
    };
  }
}

// ────────────────────────────────────────────────────────────────────
// Seed
// ────────────────────────────────────────────────────────────────────
exports.seed = async function (knex) {
  const [{ count }] = await knex('permissions').count('id');
  if (Number(count) > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] permissions already seeded. Skipping.`
    );
    return;
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] Starting permission seeding...`
  );

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  if (!systemUserId) {
    throw new Error(
      '[SEED][permissions] System user not found: system@internal.local'
    );
  }

  const activeStatusId = await knex('status')
    .where({ name: 'active' })
    .first()
    .then((r) => r?.id);
  if (!activeStatusId) {
    throw new Error('[SEED][permissions] Status "active" not found.');
  }

  // Combine all sources and dedupe
  const allKeys = [
    ...new Set([
      ...flattenPermissionKeys(PERMISSION_KEYS), // route-level
      ...DOMAIN_PERMISSION_MAPS.flatMap((map) => Object.values(map)), // ACL-layer
      ...SPECIAL_PERMISSIONS, // root_access
    ]),
  ];

  const baseFields = {
    status_id: activeStatusId,
    created_at: knex.fn.now(),
    created_by: systemUserId,
    updated_at: null,
    updated_by: null,
  };

  const rows = allKeys.map((key) => {
    const override = METADATA_OVERRIDES[key];
    return {
      id: knex.raw('uuid_generate_v4()'),
      key,
      name: override?.name ?? toTitleCase(key),
      description: override?.description ?? toDescription(key),
      ...baseFields,
    };
  });

  // Single bulk insert — much faster than per-row awaits
  await knex('permissions').insert(rows).onConflict('key').ignore();

  console.log(
    `[${new Date().toISOString()}] [SEED] Inserted ${rows.length} permissions ` +
      `(${DOMAIN_PERMISSION_MAPS.length} ACL-layer maps + route-level + ${SPECIAL_PERMISSIONS.length} special).`
  );
};
