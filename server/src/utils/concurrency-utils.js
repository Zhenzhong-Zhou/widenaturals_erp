/**
 * @async
 * @function
 * @description
 * Executes an async handler over an array of items with a maximum concurrency limit.
 * Waits for each batch of tasks to complete before continuing.
 *
 * @template T
 * @param {T[]} items - Items to process.
 * @param {number} limit - Maximum number of concurrent tasks.
 * @param {(item: T, index: number) => Promise<any>} handler - Async function to handle each item.
 * @returns {Promise<Array>} All results (flattened from resolved handlers).
 */
const processWithConcurrencyLimit = async (items, limit, handler) => {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    const settled = await Promise.allSettled(chunk.map(handler));
    for (const res of settled) {
      if (res.status === 'fulfilled' && res.value) results.push(res.value);
    }
  }
  return results;
};

module.exports = {
  processWithConcurrencyLimit,
};
