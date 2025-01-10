const { getClient, query } = require('../database/db');
const { logError, logWarn } = require('../utils/logger-helper');
const { maskSensitiveInfo } = require('../utils/sensitive-data-utils');
const AppError = require('../utils/app-error');
const { insertUserAuth } = require('./user-auth-repository');

/**
 * Inserts a new user into the `users` table.
 */
const insertUser = async (client, userDetails) => {
  const { email, roleId, statusId, firstname, lastname, phoneNumber, jobTitle, note, statusDate, createdBy } = userDetails;
  
  const sql = `
    INSERT INTO users (
      email, role_id, status_id, firstname, lastname, phone_number,
      job_title, note, status_date, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, role_id, status_id, created_at;
  `;
  const params = [email, roleId, statusId, firstname, lastname, phoneNumber, jobTitle, note, statusDate, createdBy];
  
  try {
    const result = await client.query(sql, params);
    
    if (result.rows.length === 0) {
      const maskedEmail = maskSensitiveInfo(email, 'email');
      logWarn(`User with email ${maskedEmail} already exists.`);
      throw new AppError('User already exists', 409, {
        type: 'ConflictError',
        isExpected: true,
      });
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error inserting user:', error);
    throw new AppError('Failed to insert user', 500, { type: 'DatabaseError' });
  }
};

/**
 * Creates a new user with authentication details.
 */
const createUser = async (userDetails) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN'); // Start transaction
    
    const user = await insertUser(client, userDetails);
    
    await insertUserAuth(client, {
      userId: user.id,
      passwordHash: userDetails.passwordHash,
      passwordSalt: userDetails.passwordSalt,
    });
    
    await client.query('COMMIT'); // Commit transaction
    return user;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    logError('Error creating user:', error);
    throw error instanceof AppError ? error : new AppError('Failed to create user', 500, { type: 'DatabaseError' });
  } finally {
    client.release();
  }
};

/**
 * Fetches a user by their email.
 */
const getUserByEmail = async (email) => {
  const sql = `
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
  
  try {
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      return null; // Return null if no user is found
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error fetching user by email:', error);
    throw new AppError('Failed to fetch user by email', 500, { type: 'DatabaseError' });
  }
};

/**
 * Fetches all users.
 */
const getAllUsers = async () => {
  const sql = `
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
  
  try {
    const result = await query(sql);
    return result.rows;
  } catch (error) {
    logError('Error fetching all users:', error);
    throw new AppError('Failed to fetch all users', 500, { type: 'DatabaseError' });
  }
};

/**
 * Fetches a user by their ID.
 */
const getUserById = async (id) => {
  const sql = `
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
  
  try {
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, { type: 'NotFoundError', isExpected: true });
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error fetching user by ID:', error);
    throw new AppError('Failed to fetch user by ID', 500, { type: 'DatabaseError' });
  }
};

/**
 * Updates a user's details partially.
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
  
  const sql = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *;
  `;
  
  try {
    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found for update', 404, { type: 'NotFoundError', isExpected: true });
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error updating user partially:', error);
    throw new AppError('Failed to update user', 500, { type: 'DatabaseError' });
  }
};

/**
 * Deletes a user by their ID.
 */
const deleteUser = async (id) => {
  const sql = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id;
  `;
  const params = [id];
  
  try {
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found for deletion', 404, { type: 'NotFoundError', isExpected: true });
    }
    
    return true;
  } catch (error) {
    logError('Error deleting user:', error);
    throw new AppError('Failed to delete user', 500, { type: 'DatabaseError' });
  }
};

module.exports = {
  createUser,
  getUserByEmail,
  getAllUsers,
  getUserById,
  updateUserPartial,
  deleteUser,
};
