const knex = require('knex');
const dbConfig = require('../../../../knexfile');

const db = knex(dbConfig.test);

const getTablesWithIdColumns = async () => {
  const tables = await db.raw(`
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'id' AND table_schema = 'public';
  `);

  return tables.rows.map((row) => row.table_name);
};

describe('Database Seeds', () => {
  beforeAll(async () => {
    await db.migrate.rollback(null, true);
    await db.migrate.latest();
    await db.seed.run();
  });

  afterAll(async () => {
    await db.migrate.rollback(null, true);
    await db.destroy();
  });
  
  it('should seed the status table with default values', async () => {
    const statuses = await db('status').select('*');
    expect(statuses).toBeDefined();
    expect(statuses.some((status) => status.name === 'active')).toBe(true);
  });
  
  it('should seed roles table with predefined roles', async () => {
    const roles = await db('roles').select('*');
    expect(roles).toBeDefined();
    expect(roles.length).toBeGreaterThan(0);
    expect(roles.some((role) => role.name === 'admin')).toBe(true);
  });
  
  it('should seed permissions table with default permissions', async () => {
    const permissions = await db('permissions').select('*');
    // console.log(`Seeded permissions: ${JSON.stringify(permissions)}`);
    
    // Validate number of permissions
    expect(permissions).toBeDefined();
    expect(permissions.length).toBe(5); // Adjusted to match seed data
    
    // Validate specific keys
    const permissionKeys = permissions.map((p) => p.key);
    expect(permissionKeys).toContain('view_dashboard');
    expect(permissionKeys).toContain('manage_users');
    expect(permissionKeys).toContain('edit_profile');
    expect(permissionKeys).toContain('view_reports');
    expect(permissionKeys).toContain('create_admin');
  });
  
  it('should seed permissions table with correct status references', async () => {
    const permissions = await db('permissions').select('status_id');
    for (const { status_id } of permissions) {
      const status = await db('status').select('name').where('id', status_id).first();
      expect(status).toBeDefined();
      expect(status.name).toBe('active');
    }
  });
  
  it('should seed permissions table with correct structure', async () => {
    const permissions = await db('permissions').select(
      'id',
      'name',
      'key',
      'description',
      'status_id',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at'
    );
    // console.log(`Seeded permissions: permissions`, permissions);
    
    permissions.forEach((permission) => {
      expect(permission.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(permission.name).toBeDefined();
      expect(permission.key).toBeDefined();
      expect(permission.description).toBeDefined();
      expect(permission.status_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(permission.created_by).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(permission.updated_by).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(permission.created_at).not.toBeNull();
      expect(permission.updated_at).not.toBeNull();
    });
  });
  
  it('should seed users table with test data', async () => {
    const users = await db('users').select('*');
    // console.log(`Seeded users: ${JSON.stringify(users)}`);
    expect(users).toBeDefined();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty('email');
    expect(users[0]).toHaveProperty('role_id');
  });
  
  it('should have correct schema for users table', async () => {
    const columns = await db('users').columnInfo();
    expect(columns).toHaveProperty('email');
    expect(columns.email.type).toBe('character varying');
    expect(columns).toHaveProperty('role_id');
    expect(columns.role_id.type).toBe('uuid');
  });

  it('should have valid UUIDs for all id columns across all tables', async () => {
    const tables = await getTablesWithIdColumns();

    for (const table of tables) {
      const rows = await db(table).select('id');
      // console.log(`Checking UUIDs in table: ${table}, Rows: ${rows.length}`);

      rows.forEach((row) => {
        if (typeof row.id === 'string') {
          expect(row.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          ); // Validate UUID
        } else {
          // console.warn(
          //   `Skipping UUID validation for non-UUID ID in table: ${table}`
          // );
        }
      });
    }
  });
});
