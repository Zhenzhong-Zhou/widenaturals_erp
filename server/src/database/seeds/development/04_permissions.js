const { fetchDynamicValue } = require('../03_utils');
const {
  USER_CONSTANTS,
} = require('../../../utils/constants/domain/user-constants');
const {
  ROLE_CONSTANTS,
} = require('../../../utils/constants/domain/role-constants');
const PRODUCT_CONSTANTS = require('../../../utils/constants/domain/product-constants');
const {
  SKU_CONSTANTS,
  SKU_IMAGES_CONSTANTS,
} = require('../../../utils/constants/domain/sku-constants');
const SKU_CODE_BASE_CONSTANTS = require('../../../utils/constants/domain/sku-code-base-constants');
const {
  STATUS_CONSTANTS,
} = require('../../../utils/constants/domain/status-constants');
const COMPLIANCE_RECORD_CONSTANTS = require('../../../utils/constants/domain/compliance-record-constants');
const CUSTOMER_CONSTANTS = require('../../../utils/constants/domain/customer-constants');
const DELIVERY_METHOD_CONSTANTS = require('../../../utils/constants/domain/delivery-method-constants');
const BATCH_CONSTANTS = require('../../../utils/constants/domain/batch-constants');
const PACKAGING_MATERIAL_CONSTANTS = require('../../../utils/constants/domain/packaging-material-constants');
const PRICING_CONSTANTS = require('../../../utils/constants/domain/pricing-constants');
const PAYMENT_METHOD_CONSTANTS = require('../../../utils/constants/domain/payment-method-constants');
const DISCOUNT_CONSTANTS = require('../../../utils/constants/domain/discount-constants');
const TAX_RATE_CONSTANTS = require('../../../utils/constants/domain/tax-rate-constants');
const ORDER_CONSTANTS = require('../../../utils/constants/domain/order-constants');
const ORDER_STATUS_CONSTANTS = require('../../../utils/constants/domain/order-status-constants');
const LOOKUPS = require('../../../utils/constants/domain/lookup-constants');
const PERMISSIONS = require('../../../utils/constants/domain/permissions');
const {
  ORDER_CATEGORIES,
  GENERIC_ORDER_PERMISSIONS,
} = require('../../../utils/constants/domain/order-type-constants');

const collectPermissions = (constantsObj) => {
  const results = [];

  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const value of Object.values(obj)) {
      if (typeof value === 'string') {
        if (
          /^[a-z0-9_.]+$/.test(value) &&
          (value.includes('_') || value.includes('.'))
        ) {
          results.push(value);
        }
      } else if (typeof value === 'object') {
        walk(value);
      }
    }
  };

  walk(constantsObj);

  return [...new Set(results)];
};

exports.seed = async function (knex) {
  const [{ count }] = await knex('permissions').count('id');

  if (parseInt(count, 10) > 0) {
    console.log('Skipping permissions seed: data already exists.');
    return;
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] Starting permission seeding...`
  );

  // Resolve system user (fail loudly if missing)
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

  // Resolve active status (fail loudly if missing)
  const statusRow = await knex('status')
    .select('id')
    .where('name', 'active')
    .first();
  if (!statusRow?.id) {
    throw new Error(
      '[SEED][permissions] Status "active" not found in status table'
    );
  }
  const activeStatusId = statusRow.id;

  const baseFields = {
    status_id: activeStatusId,
    created_at: knex.fn.now(),
    created_by: systemUserId,
    updated_at: null,
    updated_by: null,
  };

  const permissions = [
    {
      name: 'Root Access',
      key: 'root_access',
      description: 'Grants access to all routes and operations',
    },
  ];

  const dynamicPermissionKeys = [
    ...collectPermissions(USER_CONSTANTS),
    ...collectPermissions(ROLE_CONSTANTS),
    ...collectPermissions(PRODUCT_CONSTANTS),
    ...collectPermissions(SKU_CONSTANTS),
    ...collectPermissions(SKU_IMAGES_CONSTANTS),
    ...collectPermissions(SKU_CODE_BASE_CONSTANTS),
    ...collectPermissions(STATUS_CONSTANTS),
    ...collectPermissions(COMPLIANCE_RECORD_CONSTANTS),
    ...collectPermissions(CUSTOMER_CONSTANTS),
    ...collectPermissions(DELIVERY_METHOD_CONSTANTS),
    ...collectPermissions(BATCH_CONSTANTS),
    ...collectPermissions(PACKAGING_MATERIAL_CONSTANTS),
    ...collectPermissions(PRICING_CONSTANTS),
    ...collectPermissions(PAYMENT_METHOD_CONSTANTS),
    ...collectPermissions(DISCOUNT_CONSTANTS),
    ...collectPermissions(TAX_RATE_CONSTANTS),
    ...collectPermissions(ORDER_CONSTANTS),
    ...collectPermissions(ORDER_STATUS_CONSTANTS),
    ...collectPermissions(LOOKUPS),
    ...collectPermissions(PERMISSIONS),
  ];

  for (const key of dynamicPermissionKeys) {
    permissions.push({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      key,
      description: `Auto-generated permission for ${key.replace(/_/g, ' ')}`,
    });
  }

  // Add category-specific order permissions
  const ACTION_META = {
    view: { label: 'View', gerund: 'viewing', plural: true },
    create: { label: 'Create', gerund: 'creating', plural: false },
    update: { label: 'Update', gerund: 'updating', plural: false },
    delete: { label: 'Delete', gerund: 'deleting', plural: false },
  };

  for (const category of ORDER_CATEGORIES) {
    const displayCategory =
      category.charAt(0).toUpperCase() + category.slice(1);
    const lcCategory = category.toLowerCase();

    for (const action of Object.values(GENERIC_ORDER_PERMISSIONS)) {
      const verb = action.split('_')[0];

      const meta = ACTION_META[verb] || {
        label: verb,
        gerund: `${verb}ing`,
        plural: true,
      };

      const nameNoun = meta.plural
        ? `${displayCategory} Orders`
        : `${displayCategory} Order`;

      const descNoun = meta.plural
        ? `${lcCategory} orders`
        : `a ${lcCategory} order`;

      permissions.push({
        name: `${meta.label} ${nameNoun}`,
        key: `${verb}_${category}_order`,
        description: `Allows ${meta.gerund} ${descNoun}`,
      });
    }
  }

  // Warn for duplicate keys
  const uniquePermissions = [];
  const seenKeys = new Set();

  for (const p of permissions) {
    if (!seenKeys.has(p.key)) {
      seenKeys.add(p.key);
      uniquePermissions.push(p);
    }
  }

  let insertedCount = 0;

  for (const permission of uniquePermissions) {
    await knex('permissions')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        ...permission,
        ...baseFields,
      })
      .onConflict('key')
      .ignore();

    insertedCount++;
  }

  console.log(
    `${insertedCount} permissions processed (duplicates ignored in DB if existed).`
  );
};
