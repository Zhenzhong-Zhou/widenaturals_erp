/**
 * @file test-s3.js
 * @description Smoke test for AWS S3 connectivity (developer tool, not app code).
 *
 * Exercises list / put / presigned-get / delete on each of the three
 * configured S3 buckets to prove that:
 *   - AWS credentials are valid
 *   - Region is correct
 *   - Bucket names in env match real buckets
 *   - IAM policy grants the required operations
 *
 * Bypasses application code intentionally — this is a low-level sanity
 * check that runs BEFORE wiring S3 into services or deploying to EC2.
 *
 * Uses console output rather than the system logger because this is
 * developer-facing CLI output, not runtime application logging.
 *
 * Usage:
 *   node server/scripts/test-s3.js
 *
 * Required env (loaded via loadEnv()):
 *   AWS_REGION
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_S3_IMAGES_BUCKET
 *   AWS_S3_BACKUPS_BUCKET
 *   AWS_S3_LOGS_BUCKET
 *
 * NOTE: Adjust the loadEnv require path based on where this file lives
 * relative to your config/env.js. As written, assumes server/scripts/.
 */

const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { loadEnv } = require('../src/config/env');

loadEnv();

const REQUIRED_VARS = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_IMAGES_BUCKET',
  'AWS_S3_BACKUPS_BUCKET',
  'AWS_S3_LOGS_BUCKET',
];

const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('Missing required env vars:', missing.join(', '));
  process.exit(1);
}

const s3 = new S3Client({ region: process.env.AWS_REGION });

const TEST_KEY = `smoke-test/${Date.now()}.txt`;
const TEST_BODY = `S3 smoke test from ${new Date().toISOString()}`;

/**
 * Runs the full list / put / presign / delete cycle against a single bucket.
 * Returns true on full success, false on any step failure.
 */
const testBucket = async (bucketName, label) => {
  console.log(`\n[${label}] ${bucketName}`);
  
  // 1. List — proves ListBucket permission + bucket exists in this region
  try {
    await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
    console.log('  ✓ ListObjectsV2');
  } catch (err) {
    console.error(`  ✗ ListObjectsV2: ${err.name} — ${err.message}`);
    return false;
  }
  
  // 2. Put — proves PutObject permission + write access
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: TEST_KEY,
        Body: TEST_BODY,
        ContentType: 'text/plain',
      })
    );
    console.log(`  ✓ PutObject (${TEST_KEY})`);
  } catch (err) {
    console.error(`  ✗ PutObject: ${err.name} — ${err.message}`);
    return false;
  }
  
  // 3. Presigned GET — proves GetObject permission + presigner wiring
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: TEST_KEY }),
      { expiresIn: 60 }
    );
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text !== TEST_BODY) throw new Error('Body mismatch on fetch');
    console.log('  ✓ Presigned GET (60s expiry)');
  } catch (err) {
    console.error(`  ✗ Presigned GET: ${err.message}`);
    return false;
  }
  
  // 4. Delete — proves DeleteObject permission + cleanup
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: TEST_KEY })
    );
    console.log('  ✓ DeleteObject');
  } catch (err) {
    console.error(`  ✗ DeleteObject: ${err.name} — ${err.message}`);
    return false;
  }
  
  return true;
};

(async () => {
  console.log(`Region:    ${process.env.AWS_REGION}`);
  console.log(`IAM Key:   ${process.env.AWS_ACCESS_KEY_ID.slice(0, 8)}...`);
  
  const results = await Promise.all([
    testBucket(process.env.AWS_S3_IMAGES_BUCKET, 'images '),
    testBucket(process.env.AWS_S3_BACKUPS_BUCKET, 'backups'),
    testBucket(process.env.AWS_S3_LOGS_BUCKET, 'logs   '),
  ]);
  
  const allPassed = results.every(Boolean);
  console.log(
    `\n${allPassed ? '✓ All buckets accessible — S3 wiring confirmed' : '✗ Some buckets failed — see errors above'}`
  );
  process.exit(allPassed ? 0 : 1);
})();
