/**
 * Ensures the input is safely formatted as an array for PostgreSQL ANY($n) usage.
 * - If already an array, return as-is.
 * - If a single non-null value, wrap in an array.
 * - If null/undefined, return an empty array.
 */
const toPgArray = (input) => {
  return Array.isArray(input) ? input : input ? [input] : [];
};

module.exports = {
  toPgArray,
};
