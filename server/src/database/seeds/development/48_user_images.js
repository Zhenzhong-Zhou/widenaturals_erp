/**
 * Assign random avatar images to predefined seed users (DEV ONLY).
 *
 * Behavior:
 * - Copies avatar files from src/assets → public/uploads
 * - Inserts ONE primary avatar per user
 * - Safe to re-run (conflict + existence protected)
 * - Skipped entirely in production
 *
 * @param {import('knex').Knex} knex
 */

const fs = require('fs');
const path = require('path');
const { getImageMetadata } = require('../03_utils');

exports.seed = async function (knex) {
  // --------------------------------------------------
  // 0. Environment guard
  // --------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    console.log('[SEED:user-images] Skipped in production');
    return;
  }

  console.log('[SEED:user-images] Assigning avatars to seed users...');

  // --------------------------------------------------
  // 1. Seed user emails (SOURCE OF TRUTH)
  // --------------------------------------------------
  const SEED_USER_EMAILS = [
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
  // 2. HARD SKIP if avatars already exist
  // --------------------------------------------------
  const [{ count }] = await knex('user_images')
    .join('users', 'users.id', 'user_images.user_id')
    .whereIn('users.email', SEED_USER_EMAILS)
    .where('user_images.is_primary', true)
    .count();

  if (Number(count) > 0) {
    console.log(`[SEED:user-images] Skipped: ${count} avatar(s) already exist`);
    return;
  }

  // --------------------------------------------------
  // 3. Resolve system user (uploader)
  // --------------------------------------------------
  const systemUser = await knex('users')
    .where({ email: 'system@erp.local' })
    .first();

  if (!systemUser) {
    throw new Error('[SEED:user-images] System user not found');
  }

  // --------------------------------------------------
  // 4. Fetch target users WITHOUT primary avatar
  // --------------------------------------------------
  const users = await knex('users')
    .leftJoin('user_images', function () {
      this.on('users.id', '=', 'user_images.user_id').andOn(
        'user_images.is_primary',
        '=',
        knex.raw('true')
      );
    })
    .whereIn('users.email', SEED_USER_EMAILS)
    .whereNull('user_images.id')
    .select('users.id', 'users.email');

  if (users.length === 0) {
    console.log('[SEED:user-images] All seed users already have avatars');
    return;
  }

  // --------------------------------------------------
  // 5. Avatar source pool
  // --------------------------------------------------
  const AVATAR_POOL = [
    'src/assets/user-images/user_1.jpg',
    'src/assets/user-images/user_2.jpg',
    'src/assets/user-images/user_3.jpg',
    'src/assets/user-images/user_4.jpg',
    'src/assets/user-images/user_5.jpg',
  ];

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // --------------------------------------------------
  // 6. Ensure public upload directory
  // --------------------------------------------------
  const PUBLIC_AVATAR_DIR = path.resolve('public/uploads/user-images');
  fs.mkdirSync(PUBLIC_AVATAR_DIR, { recursive: true });

  // --------------------------------------------------
  // 7. Build insert rows + copy files
  // --------------------------------------------------
  const rows = users.map((user) => {
    const sourceRelative = pickRandom(AVATAR_POOL);
    const sourcePath = path.resolve(sourceRelative);
    const fileName = path.basename(sourceRelative);
    const targetPath = path.join(PUBLIC_AVATAR_DIR, fileName);

    // Copy once (idempotent)
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }

    const meta = getImageMetadata(sourcePath);

    return {
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      image_url: `/uploads/user-images/${fileName}`,
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
  // 8. Insert safely
  // --------------------------------------------------
  await knex('user_images')
    .insert(rows)
    .onConflict(['user_id', 'image_url'])
    .ignore();

  console.log(`[SEED:user-images] Assigned avatars to ${rows.length} users`);
};
