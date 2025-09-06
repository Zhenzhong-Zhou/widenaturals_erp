/**
 * Maps internal validation flags to human-readable issue reason messages.
 *
 * Each key corresponds to a boolean flag indicating whether a particular
 * status check passed. If false, the associated message explains the issue
 * for display or logging purposes.
 *
 * Used in functions like `getGenericIssueReason` and `enrichSkuRow` to provide
 * understandable feedback on abnormal SKU records.
 *
 * @type {Object<string, string>}
 */
const issueReasonMap = {
  skuStatusValid: 'SKU failed status check',
  productStatusValid: 'Product failed status check',
  warehouseInventoryValid: 'Warehouse inventory not in valid status',
  locationInventoryValid: 'Location inventory not in valid status',
  batchStatusValid: 'Batch not in valid status',
};

/**
 * Returns a human-readable reason message for a failed status check key.
 *
 * If the key is not recognized in the `issueReasonMap`, a fallback message is
 * generated using the key name by removing the trailing "Valid".
 *
 * @param {string} key - The status checks key (e.g., 'skuStatusValid').
 * @returns {string} A descriptive reason message for why the item is not valid.
 */
const getGenericIssueReason = (key) => {
  const fallback = `Unexpected status in ${key.replace(/Valid$/, '')}`;
  return issueReasonMap[key] || fallback;
};

module.exports = {
  getGenericIssueReason,
};
