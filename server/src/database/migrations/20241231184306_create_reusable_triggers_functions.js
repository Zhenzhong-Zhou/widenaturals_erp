/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.up = function (knex) {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION set_default_status_id()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status_id IS NULL THEN
        NEW.status_id = (SELECT id FROM status WHERE name = 'active' LIMIT 1);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.down = function (knex) {
  return knex.raw(`
    DROP FUNCTION IF EXISTS set_default_status_id;
    DROP FUNCTION IF EXISTS update_updated_at_column;
  `);
};
