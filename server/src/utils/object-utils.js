/**
 * Remove keys whose values are `null` or `undefined` from an object.
 *
 * This utility preserves the original object shape and key types,
 * returning a shallow copy with only defined values.
 *
 * Notes:
 * - Only top-level properties are inspected (no deep traversal).
 * - Keys with falsy values such as `0`, `false`, or `''` are preserved.
 * - The returned object has the same type as the input object.
 *
 * @template T
 * @param {T} obj - The source object.
 * @returns {T} A new object with `null` and `undefined` keys removed.
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
  );
};

module.exports = {
  cleanObject,
};
