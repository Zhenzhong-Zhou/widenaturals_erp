const { getClient, query } = require('../database/db');
const { logError, logWarn } = require('../utils/logger-helper');
const { maskSensitiveInfo } = require('../utils/mask');

/**
 * Inserts a new user into the database and their authentication details into the user_auth table.
 *
 * @param {object} user - User details.
 * @param {string} user.email - The user's email.
 * @param {string} user.passwordHash - The user's hashed password.
 * @param {uuid} user.roleId - The role ID associated with the user.
 * @param {uuid} user.statusId - The status ID associated with the user.
 * @param {uuid} user.createdBy - The ID of the user who created this record (optional).
 * @returns {Promise<object>} - The inserted user details.
 */
const createUser = async ({
                            email,
                            passwordHash,
                            passwordSalt,
                            roleId,
                            statusId,
                            firstname = null,
                            lastname = null,
                            phoneNumber = null,
                            jobTitle = null,
                            note = null,
                            statusDate = new Date(),
                            createdBy = null,
                          }) => {
  const client = await getClient(); // Connect to the database for transactions
  
  try {
    await client.query('BEGIN'); // Start a transaction
    
    // Insert the user into the `users` table
    const userQuery = `
      INSERT INTO users (
        email, role_id, status_id, firstname, lastname, phone_number,
        job_title, note, status_date, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role_id, status_id, created_at;
    `;
    const userParams = [
      email,
      roleId,
      statusId,
      firstname,
      lastname,
      phoneNumber,
      jobTitle,
      note,
      statusDate,
      createdBy,
    ];
    
    const userResult = await client.query(userQuery, userParams);
    
    const maskedEmail = maskSensitiveInfo(email, 'email');
    if (userResult.rows.length === 0) {
      // User already exists
      logWarn(`User with email ${maskedEmail} already exists.`);
      await client.query('ROLLBACK');
      return null; // Indicate no new user was created
    }
    
    const userId = userResult.rows[0].id;
    
    // Insert authentication details into the `user_auth` table
    const authQuery = `
      INSERT INTO user_auth (
        user_id, password_hash, password_salt, created_at
      )
      VALUES ($1, $2, $3, $4)
    `;
    const authParams = [userId, passwordHash, passwordSalt, new Date()];
    await client.query(authQuery, authParams);
    
    await client.query('COMMIT'); // Commit the transaction
    
    return userResult.rows[0]; // Return the inserted user details
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on error
    logError('Error creating user:', error);
    throw new Error('Failed to create user.');
  } finally {
    client.release(); // Release the client
  }
};

/**
 * Fetches a user by their email, including associated role and status details.
 *
 * @param {string} email - The user's email.
 * @returns {Promise<object>} - The user record with role and status details.
 */
const getUserByEmail = async (email) => {
  const text = `
    SELECT
      u.id,
      u.email,
      u.role_id,
      r.name AS role_name,
      u.status_id,
      s.name AS status_name,
      u.firstname,
      u.lastname,
      u.phone_number,
      u.job_title,
      u.note,
      u.status_date,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN status s ON u.status_id = s.id
    WHERE u.email = $1
  `;
  const params = [email];
  const result = await query(text, params);
  
  if (result.rows.length === 0) {
    return null; // User not found
  }
  
  return result.rows[0];
};

/**
 * Fetches all users, including their roles and statuses.
 *
 * @returns {Promise<array>} - An array of user records with role and status details.
 */
const getAllUsers = async () => {
  const text = `
    SELECT
      u.id,
      u.email,
      u.role_id,
      r.name AS role_name,
      u.status_id,
      s.name AS status_name,
      u.firstname,
      u.lastname,
      u.phone_number,
      u.job_title,
      u.note,
      u.status_date,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN status s ON u.status_id = s.id
    ORDER BY u.created_at DESC;
  `;
  const result = await query(text);
  return result.rows;
};

/**
 * Fetches a user by their ID, including role and status details.
 *
 * @param {uuid} id - The user's ID.
 * @returns {Promise<object>} - The user record with role and status details.
 */
const getUserById = async (id) => {
  const text = `
    SELECT
      u.id,
      u.email,
      u.role_id,
      r.name AS role_name,
      u.status_id,
      s.name AS status_name,
      u.firstname,
      u.lastname,
      u.phone_number,
      u.job_title,
      u.note,
      u.status_date,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN status s ON u.status_id = s.id
    WHERE u.id = $1;
  `;
  const params = [id];
  const result = await query(text, params);
  
  if (result.rows.length === 0) {
    return null; // User not found
  }
  
  return result.rows[0];
};

/**
 * Partially updates a user's details.
 *
 * @param {uuid} id - The user's ID.
 * @param {object} updates - Fields to update (e.g., email, firstname, lastname).
 * @returns {Promise<object>} - The updated user record.
 */
const updateUserPartial = async (id, updates) => {
  const fields = [];
  const values = [];
  let index = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
  }
  values.push(id); // Add ID as the last parameter
  
  const text = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *;
  `;
  const result = await query(text, values);
  
  if (result.rows.length === 0) {
    return null; // User not found
  }
  
  return result.rows[0];
};

/**
 * Fully updates a user's details.
 *
 * @param {uuid} id - The user's ID.
 * @param {object} user - Complete user details to update.
 * @returns {Promise<object>} - The updated user record.
 */
const updateUserFull = async (id, user) => {
  const text = `
    UPDATE users
    SET
      email = $1,
      role_id = $2,
      status_id = $3,
      firstname = $4,
      lastname = $5,
      phone_number = $6,
      job_title = $7,
      note = $8,
      status_date = $9,
      updated_at = NOW()
    WHERE id = $10
    RETURNING *;
  `;
  const params = [
    user.email,
    user.roleId,
    user.statusId,
    user.firstname,
    user.lastname,
    user.phoneNumber,
    user.jobTitle,
    user.note,
    user.statusDate,
    id,
  ];
  
  const result = await query(text, params);
  
  if (result.rows.length === 0) {
    return null; // User not found
  }
  
  return result.rows[0];
};

/**
 * Deletes a user by their ID.
 *
 * @param {uuid} id - The user's ID.
 * @returns {Promise<boolean>} - True if the user was deleted, false otherwise.
 */
const deleteUser = async (id) => {
  const text = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id;
  `;
  const params = [id];
  const result = await query(text, params);
  
  return result.rows.length > 0; // True if a row was deleted
};

module.exports = {
  createUser,
  getUserByEmail,
  getAllUsers,
  getUserById,
  updateUserPartial,
  updateUserFull,
  deleteUser,
};
