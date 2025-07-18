const { hashPasswordWithSalt } = require('../../../utils/password-helper');
const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  // Count existing user_auth records
  const [{ count: existingAuthCount }] = await knex('user_auth').count('id');
  const totalAuth = parseInt(existingAuthCount, 10) || 0;

  // Check if auth already populated
  if (totalAuth > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping user_auth seed: ${totalAuth} records already exist.`
    );
    return;
  }

  // Fetch all users
  const users = await knex('users').select(
    'id',
    'email',
    'firstname',
    'lastname',
    'role_id'
  );

  if (!users || users.length === 0) {
    console.error(
      `[${new Date().toISOString()}] [SEED] No users found. Please seed users table first.`
    );
    return;
  }

  // Fetch system role ID
  const systemRoleId = await fetchDynamicValue(
    knex,
    'roles',
    'name',
    'system',
    'id'
  );

  // Get already-authenticated user IDs to skip
  const existingAuthUserIds = new Set(await knex('user_auth').pluck('user_id'));

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

  const passwords = [...basePasswords];
  while (passwords.length < users.length) {
    passwords.push(`AutoGenP@$$${passwords.length + 1}!!`);
  }

  const userAuthData = [];
  let passwordIndex = 0;

  for (const user of users) {
    // Skip system role
    if (systemRoleId && user.role_id === systemRoleId) {
      console.log(`Skipping system user: ${user.email}`);
      continue;
    }

    // Skip already-existing auth
    if (existingAuthUserIds.has(user.id)) {
      console.log(`Skipping existing auth for user: ${user.email}`);
      continue;
    }

    const { passwordHash, passwordSalt } = await hashPasswordWithSalt(
      passwords[passwordIndex]
    );

    userAuthData.push({
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      password_hash: passwordHash,
      password_salt: passwordSalt,
      attempts: 0,
      failed_attempts: 0,
      lockout_time: null,
      last_login: knex.fn.now(),
      metadata: JSON.stringify({
        ip: `192.168.1.${passwordIndex + 1}`,
        location: `City ${passwordIndex + 1}`,
      }),
      created_at: knex.fn.now(),
      updated_at: null,
      last_changed_at: knex.fn.now(),
    });

    passwordIndex++;
  }

  if (userAuthData.length > 0) {
    await knex('user_auth').insert(userAuthData).onConflict('user_id').ignore();
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] ${userAuthData.length} user_auth records seeded successfully (excluding system or already-seeded users).`
  );
};
