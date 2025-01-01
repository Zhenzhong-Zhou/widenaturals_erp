const readline = require('readline');
const { loadEnv } = require('../../config/env');
const env = loadEnv();
const knex = require('knex')(require('../../../knexfile')[env]);

/**
 * Cleans up specified tables in the database with dynamic handling of foreign key constraints.
 */
const cleanTables = async () => {
  try {
    if (!['development', 'test'].includes(env)) {
      console.warn('Skipping cleanup in production.');
      return;
    }
    
    console.log(`Starting cleanup for environment: ${env}`);
    
    // List of tables to clean
    const tables = ['users', 'roles', 'permissions', 'status']; // Add/remove table names here as needed
    
    // Dynamically disable foreign key checks if required
    console.log('Disabling foreign key constraints...');
    await knex.raw('SET session_replication_role = replica');
    
    for (const table of tables) {
      const exists = await knex.schema.hasTable(table);
      if (exists) {
        console.log(`Cleaning table: ${table}`);
        await knex(table).del(); // Deletes all rows in the table
      } else {
        console.warn(`Table does not exist: ${table}`);
      }
    }
    
    // Re-enable foreign key constraints
    console.log('Re-enabling foreign key constraints...');
    await knex.raw('SET session_replication_role = DEFAULT');
    
    // Optionally reset table identities and cascade
    console.log('Resetting table identities...');
    await knex.raw(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
    
    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  } finally {
    await knex.destroy();
    console.log('Knex connection destroyed.');
  }
};

/**
 * Starts the cleanup process with an optional confirmation prompt.
 */
const startCleanup = async () => {
  try {
    if (env === 'staging') {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      
      // Await user confirmation for staging
      const confirmation = await new Promise((resolve) => {
        rl.question('Are you sure you want to clean up the database in staging? (yes/no): ', (answer) => {
          rl.close(); // Close the readline interface
          resolve(answer.toLowerCase());
        });
      });
      
      if (confirmation === 'yes') {
        console.log('Proceeding with cleanup...');
        await cleanTables();
      } else {
        console.log('Cleanup canceled.');
        process.exit(0); // Exit cleanly
      }
    } else {
      // Directly clean tables for development and test environments
      await cleanTables();
    }
  } catch (err) {
    console.error('Error during startCleanup:', err.message);
    process.exit(1);
  }
};

// Call the async function
(async () => {
  try {
    await startCleanup();
    console.log('Cleanup process completed successfully.');
    process.exit(0); // Exit the process cleanly
  } catch (err) {
    console.error('An error occurred during cleanup:', err.message);
    process.exit(1); // Exit the process with a failure code
  }
})();
