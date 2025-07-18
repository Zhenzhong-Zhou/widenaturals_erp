import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type {
  LookupOption,
  OrderTypeLookupItem,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector to access the order type lookup slice from the Redux store.
 */
const selectOrderTypeLookupState = (state: RootState) => state.orderTypeLookup;

/**
 * Selector to retrieve a raw list of order type items from the lookup state.
 */
export const selectOrderTypeItems = createSelector(
  [selectOrderTypeLookupState],
  (state) => state.data
);

/**
 * Selector to determine if the order type lookup is currently loading.
 */
export const selectOrderTypeLoading = createSelector(
  [selectOrderTypeLookupState],
  (state) => state.loading
);

/**
 * Selector to retrieve any error message from the order type lookup state.
 */
export const selectOrderTypeError = createSelector(
  [selectOrderTypeLookupState],
  (state) => state.error
);

/**
 * Selector to transform order type items into `LookupOption[]` for dropdown usage.
 *
 * Combines category and name if category exists, otherwise just shows name.
 * Example label: "manufacturing • Manufacturing Order"
 */
export const selectOrderTypeOptions = createSelector(
  [selectOrderTypeItems],
  (items: OrderTypeLookupItem[]): LookupOption[] =>
    items.map((item) => ({
      label: item.category ? `${item.category} • ${item.name}` : item.name,
      value: item.id,
    }))
);
