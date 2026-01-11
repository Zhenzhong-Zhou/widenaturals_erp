import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Root selector to access the pricingTypeMetadata slice of state.
 */
const selectPricingTypeMetadataState = createSelector(
  [selectRuntime],
  (runtime) => runtime.pricingTypeMetadata
);

/**
 * Selector to retrieve the pricing type metadata object.
 */
export const selectPricingTypeMetadata = createSelector(
  [selectPricingTypeMetadataState],
  (state) => state.data
);

/**
 * Selector to retrieve the loading state of pricing type metadata.
 */
export const selectPricingTypeMetadataLoading = createSelector(
  [selectPricingTypeMetadataState],
  (state) => state.isLoading
);

/**
 * Selector to retrieve the error message from the pricing type metadata state.
 */
export const selectPricingTypeMetadataError = createSelector(
  [selectPricingTypeMetadataState],
  (state) => state.error
);

/**
 * Derived selector to retrieve the status name (e.g., 'active') from metadata.
 */
export const selectPricingTypeStatusName = createSelector(
  [selectPricingTypeMetadata],
  (metadata) => metadata?.status.name ?? null
);
