const { fetchDynamicValue } = require('../03_utils');
const {
  generateStandardizedCode,
  generateCodeOrSlug,
} = require('../../../utils/code-generators');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );

  const authActions = [
    { name: 'Login Success', description: 'User successfully logged in.' },
    { name: 'Logout', description: 'User logged out.' },
    {
      name: 'Invalid Credentials',
      description: 'Login failed due to incorrect email or password.',
    },
    {
      name: 'Account Locked',
      description: 'Account locked due to security policy.',
    },
    {
      name: 'Account Inactive',
      description: 'Login failed because the account is inactive or disabled.',
    },
    {
      name: 'Password Reset Request',
      description: 'User requested a password reset link.',
    },
    {
      name: 'Password Reset Success',
      description: 'User successfully reset password.',
    },
    { name: 'Session Timeout', description: 'Session automatically expired.' },
    { name: 'Token Refresh', description: 'Access token was refreshed.' },
  ];

  let sequence = 1;
  const rows = authActions.map((action) => {
    const code = generateStandardizedCode('AUTH', action.name, {
      sequenceNumber: sequence++,
    });
    const slug = generateCodeOrSlug(action.name, { slugOnly: true });

    return {
      id: knex.raw('uuid_generate_v4()'),
      name: action.name,
      code,
      slug,
      description: action.description,
      status_id: activeStatusId,
      updated_at: null,
      created_by: systemUserId,
      updated_by: null,
    };
  });

  for (const row of rows) {
    await knex('auth_action_types').insert(row).onConflict('name').ignore();
  }

  console.log(`${rows.length} auth action types seeded.`);
};
