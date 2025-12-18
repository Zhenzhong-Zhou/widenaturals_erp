/**
 * Assign random avatar images to predefined seed users only.
 *
 * - Targets users defined in seedUsers (by email)
 * - Uses user_1.jpg → user_5.jpg
 * - Inserts ONE primary image per user
 * - Safe to re-run (conflict protected)
 *
 * @param {import('knex').Knex} knex
 */
const { getImageMetadata } = require('../03_utils');
exports.seed = async function (knex) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[SEED] Skipping user image seeding in production');
    return;
  }
  
  console.log('[SEED] Assigning avatars to predefined seed users...');
  
  // --------------------------------------------------
  // 1. Seed user emails (SOURCE OF TRUTH)
  // --------------------------------------------------
  const seedUserEmails = [
    'system@erp.local',
    'admin@erp.local',
    'manager@erp.local',
    'sales@erp.local',
    'marketing@erp.local',
    'qa@erp.local',
    'pm@erp.local',
    'account@erp.local',
    'inventory@erp.local',
    'director@erp.local',
    'admin1@erp.local',
    'admin2@erp.local',
    'manager1@erp.local',
    'manager2@erp.local',
    'sales1@erp.local',
    'sales2@erp.local',
    'marketing1@erp.local',
    'marketing2@erp.local',
    'qa1@erp.local',
    'qa2@erp.local',
    'pm1@erp.local',
    'pm2@erp.local',
    'account1@erp.local',
    'account2@erp.local',
    'inventory1@erp.local',
    'inventory2@erp.local',
    'director1@erp.local',
    'director2@erp.local',
    'user@erp.local',
  ];
  
  // --------------------------------------------------
  // 2. HARD SKIP CHECK
  // --------------------------------------------------
  const [{ count }] = await knex('user_images')
    .join('users', 'users.id', 'user_images.user_id')
    .whereIn('users.email', seedUserEmails)
    .where('user_images.is_primary', true)
    .count();
  
  if (Number(count) > 0) {
    console.log(
      `[SEED] Skipping user image seed: ${count} avatar(s) already exist for seed users`
    );
    return;
  }
  
  // --------------------------------------------------
  // 2. Resolve system user (uploader)
  // --------------------------------------------------
  const systemUser = await knex('users')
    .where({ email: 'system@erp.local' })
    .first();
  
  if (!systemUser) {
    throw new Error('System user not found for avatar seeding');
  }
  
  // --------------------------------------------------
  // 3. Fetch target users WITHOUT avatars
  // --------------------------------------------------
  const users = await knex('users')
    .leftJoin('user_images', function () {
      this.on('users.id', '=', 'user_images.user_id')
        .andOn('user_images.is_primary', '=', knex.raw('true'));
    })
    .whereIn('users.email', seedUserEmails)
    .whereNull('user_images.id')
    .select('users.id', 'users.email');
  
  if (users.length === 0) {
    console.log('[SEED] All seed users already have avatars');
    return;
  }
  
  // --------------------------------------------------
  // 4. Avatar pool
  // --------------------------------------------------
  const AVATAR_POOL = [
    'src/assets/user-images/user_1.jpg',
    'src/assets/user-images/user_2.jpg',
    'src/assets/user-images/user_3.jpg',
    'src/assets/user-images/user_4.jpg',
    'src/assets/user-images/user_5.jpg',
  ];
  
  const pickRandom = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];
  
  // --------------------------------------------------
  // 5. Build insert rows
  // --------------------------------------------------
  const rows = users.map((user) => {
    const imagePath = pickRandom(AVATAR_POOL);
    const meta = getImageMetadata(imagePath);
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      image_url: imagePath.replace('src/assets', '/uploads'),
      image_type: 'avatar',
      display_order: 0,
      is_primary: true,
      file_size_kb: meta.file_size_kb,
      file_format: meta.file_format,
      alt_text: `Avatar for ${user.email}`,
      uploaded_at: knex.fn.now(),
      uploaded_by: systemUser.id,
    };
  });
  
  // --------------------------------------------------
  // 6. Insert safely
  // --------------------------------------------------
  await knex('user_images')
    .insert(rows)
    .onConflict(['user_id', 'image_url'])
    .ignore();
  
  console.log(`[SEED] Assigned avatars to ${rows.length} seed users`);
};
