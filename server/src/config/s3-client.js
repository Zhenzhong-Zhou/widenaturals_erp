/**
 * @file s3-client.js
 * @description Singleton AWS S3 client for the WideNaturals ERP system.
 *
 * Used by services that interact with S3 (SKU images, document storage, etc.).
 * Credentials and region are resolved from environment variables that have
 * been validated upstream by `validateEnv` during bootstrap.
 *
 * AWS SDK v3 uses NodeHttpHandler under the hood, which enables HTTP keep-alive
 * by default, so a single shared client instance reuses sockets across requests.
 */

const { S3Client } = require('@aws-sdk/client-s3');
const { readRequiredEnv } = require('../config/env');

/**
 * Constructs the singleton S3 client.
 *
 * Wrapped in a function so the `@ts-ignore` needed for the AWS SDK's
 * rest-tuple constructor signature (`...args: __CheckOptionalClientConfig<S3ClientConfig>`)
 * stays scoped to this expression. The explicit `@returns {S3Client}` anchors
 * the return type, which keeps consumers from seeing `S3Client | {}` when
 * WebStorm's JSDoc inspector loses the type through the suppressed line.
 *
 * @returns {S3Client}
 */
const buildS3Client = () => {
  // @ts-ignore -- AWS SDK v3 rest-tuple constructor signature confuses
  // WebStorm's JSDoc inspector. tsc accepts this call as written.
  return new S3Client({
    region: readRequiredEnv('AWS_REGION'),
    credentials: {
      accessKeyId: readRequiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: readRequiredEnv('AWS_SECRET_ACCESS_KEY'),
    },
  });
};

/**
 * Shared S3 client instance. Reuse across the app — do not construct new
 * S3Client instances per request, as that defeats connection pooling.
 *
 * @type {S3Client}
 */
const s3Client = buildS3Client();

module.exports = s3Client;
