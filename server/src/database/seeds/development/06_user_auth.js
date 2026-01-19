const { fetchDynamicValue } = require('../03_utils');
const { hashPassword } = require('../../../business/user-auth-business');
const {
  validatePasswordStrength,
} = require('../../../security/password-policy');

exports.seed = async function (knex) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('user_auth seed must not run in production');
  }
  
  const [{ count }] = await knex('user_auth').count('id');
  if (Number(count) > 0) {
    console.log('[SEED] user_auth already populated. Skipping.');
    return;
  }
  
  const users = await knex('users').select('id', 'email', 'role_id');
  if (!users.length) {
    console.warn('[SEED] No users found. Seed users first.');
    return;
  }
  
  const systemRoleId = await fetchDynamicValue(
    knex,
    'roles',
    'name',
    'system',
    'id'
  );
  
  const userAuthData = [];
  
  for (const user of users) {
    // System user never gets interactive auth
    if (user.role_id === systemRoleId) continue;
    
    const emailPrefix = user.email.split('@')[0];
    
    /**
     * DEV PASSWORD STRATEGY
     * ---------------------
     * - Deterministic
     * - Policy-compliant
     * - Unique per user
     * - Requires reset on first login
     */
    const password = `${process.env.DEV_ONLY_PASSWORD}${emailPrefix}`;
    
    // Enforce password policy even in seeds
    validatePasswordStrength(password);
    
    const passwordHash = await hashPassword(password);
    
    userAuthData.push({
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      password_hash: passwordHash,
      attempts: 0,
      failed_attempts: 0,
      lockout_time: null,
      last_login: null,
      metadata: JSON.stringify({
        seeded: true,
        requirePasswordReset: true,
        passwordStrategy: 'dev-deterministic-email',
      }),
      created_at: knex.fn.now(),
      updated_at: null,
      last_changed_at: knex.fn.now(),
    });
  }
  
  if (userAuthData.length) {
    await knex('user_auth')
      .insert(userAuthData)
      .onConflict('user_id')
      .ignore();
  }
  
  console.log(
    `[SEED] ${userAuthData.length} user_auth records seeded (DEV only).`
  );
};
