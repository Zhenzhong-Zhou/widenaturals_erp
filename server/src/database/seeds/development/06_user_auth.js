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
  
  const basePasswords = [
    'Passw0rd!@#',
    'Secur3P@$$!!',
    'Str0ngP@$$w0rD!!',
    'P@$$word2023!!',
    'Adm!n12345!!',
    'TestP@$$!!',
    'S@mpleP@$$word!!',
    'HelloW0rld!!@',
    'P@$$wordMagic!!',
    'SeCurE!@12345',
  ];
  
  const userAuthData = [];
  let index = 0;
  
  for (const user of users) {
    if (user.role_id === systemRoleId) continue;
    
    const password =
      basePasswords[index % basePasswords.length] +
      `_${index + 1}`;
    
    // Enforce policy even in seeds
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
      }),
      created_at: knex.fn.now(),
      updated_at: null,
      last_changed_at: knex.fn.now(),
    });
    
    index++;
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
