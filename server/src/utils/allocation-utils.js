/**
 * Determines the overall order status based on its allocation statuses.
 *
 * Logic:
 * - If all allocations are ALLOC_COMPLETED → ORDER_ALLOCATED
 * - If any allocation is ALLOC_PARTIAL → ORDER_ALLOCATING
 * - If no allocations exist → ORDER_CONFIRMED (fallback)
 *
 * @param {Array<{ status_code: string }>} allocations - Array of allocation records.
 * @returns {string} - The derived order status code.
 */
const determineOrderStatusFromAllocations = (allocations = []) => {
  if (allocations.length === 0) return 'ORDER_CONFIRMED'; // fallback if no allocations

  const allStatuses = allocations.map((a) => a.status_code);
  const allCompleted = allStatuses.every((code) => code === 'ALLOC_COMPLETED');
  const somePartial = allStatuses.some((code) => code === 'ALLOC_PARTIAL');

  if (allCompleted) return 'ORDER_ALLOCATED';
  if (somePartial) return 'ORDER_ALLOCATING';

  return 'ORDER_ALLOCATING'; // default if in progress
};

module.exports = {
  determineOrderStatusFromAllocations,
};
