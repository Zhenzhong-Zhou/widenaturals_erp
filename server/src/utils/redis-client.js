const Redis = require('ioredis');
const { loadEnv } = require('../config/env');

loadEnv();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  user: process.env.REDIS_USERNAME || 'user',
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined, // Secure in production
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redisClient;
