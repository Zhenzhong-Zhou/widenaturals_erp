const { fetchDynamicValue, fetchDynamicValues } = require('../03_utils');

/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  const [{ count }] = await knex('users').count('id');
  const total = parseInt(count, 10) || 0;

  if (total > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping users seed: ${total} records already exist.`
    );
    return;
  }

  console.log(`[${new Date().toISOString()}] [SEED] Starting users seeding...`);

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  const statusIds = await fetchDynamicValues(
    knex,
    'status',
    'name',
    ['active', 'inactive', 'discontinued', 'archived', 'deleted'],
    'id'
  );

  const roleIds = await fetchDynamicValues(
    knex,
    'roles',
    'name',
    [
      'system',
      'admin',
      'manager',
      'sales',
      'marketing',
      'qa',
      'product_manager',
      'account',
      'inventory',
      'user',
      'manufacturing_director',
    ],
    'id'
  );

  const now = new Date().toISOString();

  const baseFields = {
    status_id: statusIds.active, // Use named lookup for clarity
    status_date: now,
    created_at: now,
    updated_at: now, // Set to `now` instead of `null` for consistency
    created_by: systemUserId,
    updated_by: systemUserId, // Also set to systemUserId for traceability
  };

  const seedUsers = [
    {
      email: 'system@erp.local',
      role_id: roleIds.system,
      firstname: 'System',
      lastname: 'Bot',
      job_title: 'System Automation',
      phone_number: null,
      note: 'System-level service user',
      status_id: statusIds.active,
    },
    {
      email: 'admin@erp.local',
      role_id: roleIds.admin,
      firstname: 'Alice',
      lastname: 'Admin',
      job_title: 'Administrator',
      phone_number: null,
      note: 'Default admin account',
      status_id: statusIds.active,
    },
    {
      email: 'manager@erp.local',
      role_id: roleIds.manager,
      firstname: 'Manny',
      lastname: 'Manager',
      job_title: 'General Manager',
      phone_number: null,
      note: 'Covers high-level operations',
      status_id: statusIds.active,
    },
    {
      email: 'sales@erp.local',
      role_id: roleIds.sales,
      firstname: 'Selina',
      lastname: 'Sales',
      job_title: 'Sales Representative',
      phone_number: null,
      note: 'Test sales role user',
      status_id: statusIds.inactive,
    },
    {
      email: 'marketing@erp.local',
      role_id: roleIds.marketing,
      firstname: 'Mark',
      lastname: 'Marketing',
      job_title: 'Marketing Coordinator',
      phone_number: null,
      note: 'For marketing permissions testing',
      status_id: statusIds.pending,
    },
    {
      email: 'qa@erp.local',
      role_id: roleIds.qa,
      firstname: 'Quinn',
      lastname: 'Quality',
      job_title: 'QA Tester',
      phone_number: null,
      note: 'Covers QA permissions',
      status_id: statusIds.active,
    },
    {
      email: 'pm@erp.local',
      role_id: roleIds.product_manager,
      firstname: 'Paula',
      lastname: 'PM',
      job_title: 'Product Manager',
      phone_number: null,
      note: 'Product planning and roadmap',
      status_id: statusIds.discontinued,
    },
    {
      email: 'account@erp.local',
      role_id: roleIds.account,
      firstname: 'Andy',
      lastname: 'Accountant',
      job_title: 'Accountant',
      phone_number: null,
      note: 'Handles finance and reports',
      status_id: statusIds.archived,
    },
    {
      email: 'inventory@erp.local',
      role_id: roleIds.inventory,
      firstname: 'Ivy',
      lastname: 'Inventory',
      job_title: 'Inventory Clerk',
      phone_number: null,
      note: 'Inventory management testing',
      status_id: statusIds.active,
    },
    {
      email: 'director@erp.local',
      role_id: roleIds.manufacturing_director,
      firstname: 'Dan',
      lastname: 'Director',
      job_title: 'Manufacturing Director',
      phone_number: null,
      note: 'Oversees production process',
      status_id: statusIds.pending,
    },
    {
      email: 'admin1@erp.local',
      role_id: roleIds.admin,
      firstname: 'Alice',
      lastname: 'Admin',
      job_title: 'Administrator',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'admin2@erp.local',
      role_id: roleIds.admin,
      firstname: 'Aaron',
      lastname: 'Root',
      job_title: 'Admin Lead',
      phone_number: null,
      note: '',
      status_id: statusIds.inactive,
    },
    {
      email: 'manager1@erp.local',
      role_id: roleIds.manager,
      firstname: 'Manny',
      lastname: 'Manager',
      job_title: 'Operations Manager',
      phone_number: null,
      note: '',
      status_id: statusIds.pending,
    },
    {
      email: 'manager2@erp.local',
      role_id: roleIds.manager,
      firstname: 'Mira',
      lastname: 'Lead',
      job_title: 'Regional Manager',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'sales1@erp.local',
      role_id: roleIds.sales,
      firstname: 'Selina',
      lastname: 'Sales',
      job_title: 'Sales Rep',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'sales2@erp.local',
      role_id: roleIds.sales,
      firstname: 'Sam',
      lastname: 'Seller',
      job_title: 'Sales Lead',
      phone_number: null,
      note: '',
      status_id: statusIds.archived,
    },
    {
      email: 'marketing1@erp.local',
      role_id: roleIds.marketing,
      firstname: 'Mark',
      lastname: 'Keting',
      job_title: 'Marketing Exec',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'marketing2@erp.local',
      role_id: roleIds.marketing,
      firstname: 'Marie',
      lastname: 'Brand',
      job_title: 'Brand Strategist',
      phone_number: null,
      note: '',
      status_id: statusIds.discontinued,
    },
    {
      email: 'qa1@erp.local',
      role_id: roleIds.qa,
      firstname: 'Quinn',
      lastname: 'Tester',
      job_title: 'QA Analyst',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'qa2@erp.local',
      role_id: roleIds.qa,
      firstname: 'Qiao',
      lastname: 'Assure',
      job_title: 'Quality Lead',
      phone_number: null,
      note: '',
      status_id: statusIds.inactive,
    },
    {
      email: 'pm1@erp.local',
      role_id: roleIds.product_manager,
      firstname: 'Paula',
      lastname: 'Product',
      job_title: 'Product Owner',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'pm2@erp.local',
      role_id: roleIds.product_manager,
      firstname: 'Phil',
      lastname: 'Maker',
      job_title: 'Product Dev',
      phone_number: null,
      note: '',
      status_id: statusIds.pending,
    },
    {
      email: 'account1@erp.local',
      role_id: roleIds.account,
      firstname: 'Andy',
      lastname: 'Cash',
      job_title: 'Bookkeeper',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'account2@erp.local',
      role_id: roleIds.account,
      firstname: 'Alina',
      lastname: 'Ledger',
      job_title: 'Account Manager',
      phone_number: null,
      note: '',
      status_id: statusIds.archived,
    },
    {
      email: 'inventory1@erp.local',
      role_id: roleIds.inventory,
      firstname: 'Ivy',
      lastname: 'Stock',
      job_title: 'Inventory Clerk',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'inventory2@erp.local',
      role_id: roleIds.inventory,
      firstname: 'Ian',
      lastname: 'Counts',
      job_title: 'Inventory Analyst',
      phone_number: null,
      note: '',
      status_id: statusIds.inactive,
    },
    {
      email: 'director1@erp.local',
      role_id: roleIds.manufacturing_director,
      firstname: 'Dan',
      lastname: 'Direct',
      job_title: 'Director',
      phone_number: null,
      note: '',
      status_id: statusIds.active,
    },
    {
      email: 'director2@erp.local',
      role_id: roleIds.manufacturing_director,
      firstname: 'Dora',
      lastname: 'Lead',
      job_title: 'Manufacturing Head',
      phone_number: null,
      note: '',
      status_id: statusIds.discontinued,
    },
    {
      email: 'user@erp.local',
      role_id: roleIds.user,
      firstname: 'Ula',
      lastname: 'User',
      job_title: 'Basic User',
      phone_number: null,
      note: '',
      status_id: statusIds.pending,
    },
  ];

  let insertedCount = 0;

  for (const user of seedUsers) {
    const id = knex.raw('uuid_generate_v4()');

    const data = {
      id,
      ...user,
      ...baseFields,
    };

    const result = await knex('users')
      .insert(data)
      .onConflict('email')
      .ignore();

    if (result.rowCount === 0) {
      console.warn(`[SEED] Skipped duplicate user email: ${user.email}`);
    } else {
      insertedCount++;
    }
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] Inserted ${insertedCount} new users.`
  );
};
