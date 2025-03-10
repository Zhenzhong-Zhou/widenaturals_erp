const { hashPasswordWithSalt } = require('../../../utils/password-helper');

const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  // Fetch existing users
  const users = await knex('users')
    .select('id', 'email', 'firstname', 'lastname', 'role_id');
  
  if (!users || users.length === 0) {
    console.error(
      'No users found in the database. Please seed the users table first.'
    );
    return;
  }

  // Fetch the system role ID dynamically
  const systemRoleId = await fetchDynamicValue(knex, 'roles', 'name', 'system', 'id');
  
  // Define base passwords
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
  
  // Generate additional passwords dynamically if needed
  const totalPasswords = users.length;
  const passwords = [...basePasswords];
  
  for (let i = passwords.length; i < totalPasswords; i++) {
    passwords.push(`AutoGenP@$$${i + 1}!!`);
  }
  
  // Define user_auth data
  const userAuthData = [];
  let passwordIndex = 0;
  
  for (const user of users) {
    // Skip password hashing for the system user
    if (systemRoleId && user.role_id === systemRoleId) {
      console.log(`Skipping password creation for system user: ${user.email}`);
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
      updated_at: knex.fn.now(),
      last_changed_at: knex.fn.now(),
    });
    
    passwordIndex++;
  }
  
  // Insert user_auth data
  if (userAuthData.length > 0) {
    await knex('user_auth')
      .insert(userAuthData)
      .onConflict('user_id') // Skip if user_id already exists
      .ignore();
  }
  
  console.log(
    `${userAuthData.length} user_auth records seeded successfully (excluding system user).`
  );
};
