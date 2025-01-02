/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.up = function (knex) {
  return knex.raw(`
   -- Attach updated_at trigger to status table
    CREATE TRIGGER set_status_updated_at
    BEFORE UPDATE ON status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
    -- Attach default status_id trigger to roles table
    CREATE TRIGGER set_roles_default_status_id
    BEFORE INSERT ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    -- Attach default status_id trigger to users table
    CREATE TRIGGER set_users_default_status_id
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    -- Attach updated_at trigger to roles table
    CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- Attach updated_at trigger to users table
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.down = function (knex) {
  return knex.raw(`
    -- Drop triggers
    DROP TRIGGER IF EXISTS set_status_updated_at ON status;
    DROP TRIGGER IF EXISTS set_roles_default_status_id ON roles;
    DROP TRIGGER IF EXISTS set_users_default_status_id ON users;
    DROP TRIGGER IF EXISTS set_roles_updated_at ON roles;
    DROP TRIGGER IF EXISTS set_users_updated_at ON users;
  `);
};
