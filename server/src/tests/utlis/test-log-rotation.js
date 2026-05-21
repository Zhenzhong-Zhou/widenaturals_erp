const { loadEnv } = require('../../config/env');

loadEnv();

console.log('After loadEnv:', {
  AWS_S3_LOGS_BUCKET: process.env.AWS_S3_LOGS_BUCKET,
  NODE_ENV: process.env.NODE_ENV,
});


const logger = require('../../utils/logging/logger');

(async () => {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('AWS_S3_LOGS_BUCKET:', process.env.AWS_S3_LOGS_BUCKET);
  console.log('LOGS_DIR:', process.env.LOGS_DIR);
  
  console.log('Spamming logger to force size-based rotation...');
  
  for (let i = 0; i < 200000; i += 1) {
    logger.info('log rotation test', {
      iteration: i,
      padding: 'x'.repeat(5000),
    });
  }
  
  console.log('Finished writing logs. Waiting for rotation/upload hooks...');
  
  await new Promise((resolve) => setTimeout(resolve, 15000));
  
  console.log('Done. Check S3 bucket and dev_logs/ folder.');
  
  logger.end();
})();
