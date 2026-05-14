import { createContext, type Dispatch, type SetStateAction } from 'react';
import type {
  BatchRegistryForInventoryLookupQuery,
  BatchRegistryLookupItem,
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
  fetchParamsArray: BatchRegistryForInventoryLookupQuery[];
  setFetchParamsArray: Dispatch<
    SetStateAction<BatchRegistryForInventoryLookupQuery[]>
  >;
  options: BatchRegistryLookupItem[];
  loading: boolean;
  error: string | null;
  paginationMeta: PaginationLookupInfo;
  fetchOptions: (params: BatchRegistryForInventoryLookupQuery) => void;
  defaultQuery: BatchRegistryForInventoryLookupQuery;
  globalBatchType: BatchTypeFilter;
  pickedBatches: Record<string, BatchRegistryLookupItem>;
  cachePickedBatch: (item: BatchRegistryLookupItem) => void;
}

export const BatchLookupContext = createContext<BatchLookupBundle | null>(null);
