const knex = require('knex');
const dbConfig = require('../../../../knexfile');

const db = knex(dbConfig.test);

describe('Database Migrations', () => {
  const expectedTables = [
    'roles',
    'status',
    'users',
    'auth_action_types',
    'role_permissions',
    'permissions',
    'auth_action_status',
    'user_auth',
    'status_entity_types',
    'entity_types',
    'location_types',
    'locations',
    'pricing_types',
    'delivery_methods',
    'products',
    'compliances',
    'pricing',
    'inventory',
    'customers',
    'inventory_action_types',
    'inventory_history',
    'order_types',
    'orders',
    'tracking_numbers',
    'returns',
    'sales_orders',
    'order_items',
    'return_items',
    'inventory_activity_log',
  ];

  const knexTables = ['knex_migrations', 'knex_migrations_lock'];

  beforeEach(async () => {
    await db.migrate.rollback(null, true); // Rollback all migrations
    await db.migrate.latest(); // Reapply migrations
  });

  afterAll(async () => {
    await db.destroy(); // Close the database connection
  });

  it('should create all expected tables', async () => {
    for (const table of expectedTables.concat(knexTables)) {
      const exists = await db.schema.hasTable(table);
      // console.log(`Checking table: ${table} - Exists: ${exists}`);
      expect(exists).toBe(true);
    }
  });

  it('should rollback all migrations without errors', async () => {
    await db.migrate.rollback(null, true);

    for (const table of expectedTables) {
      const exists = await db.schema.hasTable(table);
      // console.log(`Table after rollback: ${table} - Exists: ${exists}`);
      expect(exists).toBe(false); // User-defined tables should not exist
    }

    for (const table of knexTables) {
      const exists = await db.schema.hasTable(table);
      // console.log(`Knex-specific table: ${table} - Exists: ${exists}`);
      expect(exists).toBe(true); // Knex tables should persist
    }
  });

  it('should reapply migrations without errors', async () => {
    await db.migrate.latest();

    for (const table of expectedTables.concat(knexTables)) {
      const exists = await db.schema.hasTable(table);
      // console.log(`Table after reapply: ${table} - Exists: ${exists}`);
      expect(exists).toBe(true);
    }
  });

  it('should have the correct schema for the users table', async () => {
    const columns = await db('users').columnInfo();
    expect(columns).toHaveProperty('id');
    expect(columns.id.type).toBe('uuid');
    expect(columns).toHaveProperty('email');
    expect(columns.email.type).toBe('character varying');
    expect(columns).toHaveProperty('created_at');
    expect(columns.created_at.type).toBe('timestamp with time zone'); // PostgreSQL-specific
  });
});
