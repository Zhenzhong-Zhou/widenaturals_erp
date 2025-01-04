/**
 * @file cleanTables.js
 * @description Cleans up specified tables in the database using TRUNCATE with CASCADE.
 */

const readline = require('readline');
const { loadEnv } = require('../../config/env');
const { logInfo, logWarn, logError } = require('../../utils/loggerHelper');
const env = loadEnv();
const knex = require('knex')(require('../../../knexfile')[env]);

/**
 * Cleans up specified tables in the database using TRUNCATE with CASCADE.
 * All operations are wrapped in a transaction for atomicity.
 * @param {Array<string>} tableList - List of table names to clean up.
 */
const cleanTables = async (tableList = []) => {
  if (!['development', 'test', 'staging'].includes(env)) {
    logWarn('Skipping cleanup in production.');
    return 0; // Indicate success
  }
  
  logInfo(`Starting cleanup for environment: ${env}`);
  if (tableList.length === 0) {
    logError(new Error('No tables specified for cleanup.'));
    return 1; // Indicate failure
  }
  
  const trx = await knex.transaction(); // Start transaction
  try {
    logInfo('Cleaning tables with TRUNCATE CASCADE...');
    await trx.raw(`TRUNCATE TABLE ${tableList.join(', ')} RESTART IDENTITY CASCADE`);
    logInfo('Tables cleaned successfully.');
    
    await trx.commit(); // Commit transaction
    logInfo('Transaction committed.');
    return 0; // Indicate success
  } catch (err) {
    logError(err, null, { additionalInfo: 'Error during cleanup' });
    await trx.rollback(); // Rollback transaction
    logWarn('Transaction rolled back.');
    return 1; // Indicate failure
  } finally {
    await knex.destroy();
    logInfo('Knex connection destroyed.');
  }
};

/**
 * Starts the cleanup process with an optional confirmation prompt.
 * @param {Array<string>} tableList - List of table names to clean up.
 */
const startCleanup = async (tableList = []) => {
  if (env === 'staging') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const confirmation = await new Promise((resolve) => {
      rl.question(
        'Are you sure you want to clean up the database in staging? (yes/no): ',
        (answer) => {
          rl.close();
          resolve(answer.toLowerCase());
        }
      );
    });
    
    if (confirmation !== 'yes') {
      logInfo('Cleanup canceled.');
      return 0; // Indicate success without performing cleanup
    }
  }
  
  return await cleanTables(tableList);
};

// If run as a script, handle process exit logic
if (require.main === module) {
  (async () => {
    const tables = ['users', 'roles', 'permissions', 'status']; // Default table list
    const exitCode = await startCleanup(tables);
    process.exit(exitCode);
  })();
}

module.exports = { cleanTables, startCleanup };
