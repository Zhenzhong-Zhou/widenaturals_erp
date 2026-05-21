/**
 * @file s3-client.js
 * @description Lazy singleton AWS S3 client for the WideNaturals ERP system.
 *
 * Used by services that interact with S3, such as SKU images and document
 * storage. Credentials and region are resolved from environment variables
 * only when the S3 client is first requested.
 *
 * Lazy construction keeps environment reads out of module load time. This
 * allows standalone scripts to import this module before calling loadEnv(),
 * as long as loadEnv() / validateEnv() run before getS3Client() is called.
 *
 * AWS SDK v3 uses NodeHttpHandler under the hood, which enables HTTP
 * keep-alive by default, so a single shared client instance reuses sockets
 * across requests.
 */

const { S3Client } = require('@aws-sdk/client-s3');
const { readRequiredEnv } = require('../config/env');

/**
 * Cached singleton S3 client instance.
 *
 * @type {S3Client | null}
 */
let s3Client = null;

/**
 * Constructs a new S3 client.
 *
 * Wrapped in a function so the `@ts-ignore` needed for the AWS SDK's
 * rest-tuple constructor signature stays scoped to this expression.
 *
 * @returns {S3Client}
 */
const buildS3Client = () => {
  // @ts-ignore -- AWS SDK v3 rest-tuple constructor signature can confuse
  // WebStorm's JSDoc inspector in CommonJS. tsc accepts this call as written.
  return new S3Client({
    region: readRequiredEnv('AWS_REGION'),
    credentials: {
      accessKeyId: readRequiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: readRequiredEnv('AWS_SECRET_ACCESS_KEY'),
    },
  });
};

/**
 * Returns the singleton S3 client, constructing it on first call.
 *
 * Reuse this client across the app. Do not construct new S3Client instances
 * per request, because that defeats connection pooling.
 *
 * @returns {S3Client}
 */
const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }
  
  s3Client = buildS3Client();
  return s3Client;
};

module.exports = {
  getS3Client,
};
