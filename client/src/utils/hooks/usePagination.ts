import { useState } from 'react';
import { DEFAULT_PAGINATION, type Pagination } from '@shared-types/pagination';

/**
 * usePagination
 *
 * UI-only pagination state hook.
 *
 * Responsibilities:
 * - Owns client-side pagination state (page, limit)
 * - Provides setters for list/table components
 *
 * Notes:
 * - This hook is NOT tied to Redux
 * - This hook does NOT normalize API responses
 * - Server-provided pagination must be normalized separately
 */
const usePagination = () => {
  const [pagination, setPagination] =
    useState<Pagination>(DEFAULT_PAGINATION);
  
  return { pagination, setPagination };
};

export default usePagination;
