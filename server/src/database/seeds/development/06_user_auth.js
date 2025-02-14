const { hashPasswordWithSalt } = require('../../../utils/password-helper');

exports.seed = async function (knex) {
  // Fetch existing users
  const users = await knex('users').select(
    'id',
    'email',
    'firstname',
    'lastname'
  );

  if (!users || users.length === 0) {
    console.error(
      'No users found in the database. Please seed the users table first.'
    );
    return;
  }

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
  for (let i = 0; i < users.length; i++) {
    const { passwordHash, passwordSalt } = await hashPasswordWithSalt(
      passwords[i]
    );
    userAuthData.push({
      id: knex.raw('uuid_generate_v4()'),
      user_id: users[i].id,
      password_hash: passwordHash,
      password_salt: passwordSalt,
      attempts: 0,
      failed_attempts: 0,
      lockout_time: null,
      last_login: knex.fn.now(),
      metadata: JSON.stringify({
        ip: `192.168.1.${i + 1}`,
        location: `City ${i + 1}`,
      }),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      last_changed_at: knex.fn.now(),
    });
  }

  // Insert user_auth data
  for (const auth of userAuthData) {
    await knex('user_auth')
      .insert(auth)
      .onConflict('user_id') // Skip if user_id already exists
      .ignore();
  }

  console.log(
    `${users.length} users and user_auth records seeded successfully.`
  );
};
