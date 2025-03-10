const { loadEnv } = require('../../config/env');
loadEnv(); // Ensure environment variables are loaded

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  try {
    await knex.raw("SET timezone = 'UTC';"); // Set session timezone
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'); // Enable uuid-ossp extension
    
    if (process.env.DB_NAME) {
      await knex.raw(
        `ALTER DATABASE ${process.env.DB_NAME} SET timezone TO 'UTC';`
      ); // Set DB timezone to UTC
    } else {
      console.warn("⚠️ Warning: DB_NAME is not set. Skipping ALTER DATABASE.");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  try {
    console.warn("⚠️ Skipping DROP EXTENSION uuid-ossp (used by UUID columns).");
    
    if (process.env.DB_NAME) {
      await knex.raw(
        `ALTER DATABASE ${process.env.DB_NAME} SET timezone TO DEFAULT;`
      ); // Reset DB timezone
    } else {
      console.warn("⚠️ Warning: DB_NAME is not set. Skipping ALTER DATABASE.");
    }
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
};
