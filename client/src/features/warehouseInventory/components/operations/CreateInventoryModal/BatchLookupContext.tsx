import { createContext, type Dispatch, type SetStateAction } from 'react';
import type {
  BatchRegistryLookupItem,
  BatchRegistryLookupQuery,
} from '@features/lookup';
import type { PaginationLookupInfo } from '@shared-types/pagination';
import type { BatchTypeFilter } from '@shared-types/batch';

/**
 * Shared lookup state passed from CreateInventoryModal down to each
 * row's BatchIdCell. Owned by the modal (via useCreateInventoryBatchLookup),
 * consumed via context to avoid prop-drilling through MultiItemForm.
 */
export interface BatchLookupBundle {
  inputValues: string[];
  setInputValues: Dispatch<SetStateAction<string[]>>;
  fetchParamsArray: BatchRegistryLookupQuery[];
  setFetchParamsArray: Dispatch<SetStateAction<BatchRegistryLookupQuery[]>>;
  options: BatchRegistryLookupItem[];
  loading: boolean;
  error: string | null;
  paginationMeta: PaginationLookupInfo;
  fetchOptions: (params: BatchRegistryLookupQuery) => void;
  defaultQuery: BatchRegistryLookupQuery;
  globalBatchType: BatchTypeFilter;
  pickedBatches: Record<string, BatchRegistryLookupItem>;
  cachePickedBatch: (item: BatchRegistryLookupItem) => void;
}

export const BatchLookupContext = createContext<BatchLookupBundle | null>(null);
