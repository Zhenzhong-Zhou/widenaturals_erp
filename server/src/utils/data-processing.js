import { chunkArray } from './array-utils';
import { retry } from '../database/db';

const insertLargeDataset = async (tableName, columns, rows, client) => {
  const chunks = chunkArray(rows, 100); // Split rows into chunks of 100
  for (const chunk of chunks) {
    await bulkInsert(tableName, columns, chunk, client);
  }
};

/**
 * Processes a large dataset with chunking and retry logic.
 *
 * @param {Array} dataset - The dataset to process.
 * @param {function} processChunkFn - Function to process a single chunk of data.
 * @param {number} [chunkSize=100] - The size of each chunk.
 * @param {number} [retryAttempts=3] - Number of retry attempts for each chunk.
 * @returns {Promise<void>} - Resolves when all chunks are processed.
 */
const processLargeDatasetWithRetry = async (
  dataset,
  processChunkFn,
  chunkSize = 100,
  retryAttempts = 3
) => {
  const chunks = chunkArray(dataset, chunkSize);

  for (const chunk of chunks) {
    await retry(async () => {
      await processChunkFn(chunk);
    }, retryAttempts);
  }
};

module.exports = { insertLargeDataset, processLargeDatasetWithRetry };
