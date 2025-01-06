const { hashPasswordWithSalt } = require('../utils/hash-password');
const { createUser } = require('../repositories/user-repository');
const { getClient } = require('../database/db');
const { logError, logInfo, logWarn, logFatal } = require('../utils/logger-helper');

/**
 * Initializes the root admin account if it doesn't already exist.
 */
const initializeRootAdmin = async () => {
  const email = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;
  
  if (!email || !password) {
    logFatal('Root admin credentials are missing in environment variables.');
    process.exit(1); // Terminate if credentials are missing
  }
  
  // Hash the password with a unique salt
  const { passwordHash, passwordSalt } = await hashPasswordWithSalt(password);
  
  const client = await getClient()
  try {
    await client.query('BEGIN');
    
    // Create the root admin user
    const user = await createUser({
      email,
      passwordHash,
      passwordSalt,
      roleId: (await client.query(`SELECT id FROM roles WHERE name = 'root_admin'`)).rows[0].id,
      statusId: (await client.query(`SELECT id FROM status WHERE name = 'active'`)).rows[0].id,
      firstname: 'Root', // Optional, can be null
      lastname: 'Admin', // Optional, can be null
      phoneNumber: null, // Optional
      jobTitle: 'System Administrator', // Optional, can be null
      note: 'Initial root admin account', // Optional
      statusDate: new Date(), // Default to current date
      createdBy: null, // No creator for the root admin
    });
    
    if (!user) {
      logWarn('Root admin already exists.');
      await client.query('ROLLBACK');
      return;
    }
    
    await client.query('COMMIT');
    logInfo('Root admin initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logError('Error initializing root admin:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { initializeRootAdmin };
