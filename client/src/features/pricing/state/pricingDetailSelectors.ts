import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { PricingLocation } from '@features/pricing';
import type { PricingState } from '@features/pricing/state/pricingDetailSlice';

const selectPricingState = (state: RootState) =>
  (state.pricing as PricingState) ?? {
    pricing: null,
    pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
    loading: false,
    error: null,
  };

/**
 * Selects full pricing details from Redux state.
 */
export const selectPricingDetails = createSelector(
  selectPricingState,
  (pricingState) => pricingState.pricing
);

/**
 * Memoized selector for all products related to the pricing.
 */
export const selectProducts = createSelector(
  selectPricingDetails,
  (pricing) => pricing?.products ?? []
);

/**
 * Memoized selector for all locations related to the pricing.
 */
export const selectLocations = createSelector(
  selectPricingDetails,
  (pricing) => pricing?.locations ?? []
);

/**
 * Memoized selector for the first product (if needed for display).
 */
export const selectFirstProduct = createSelector(
  selectProducts,
  (products) => products[0] ?? null
);

/**
 * Memoized selector for the first location (if needed for display).
 */
export const selectFirstLocation = createSelector(
  selectLocations,
  (locations) => locations[0] ?? null
);

/**
 * Memoized selector for all unique location types.
 */
export const selectLocationTypes = createSelector(
  selectLocations,
  (locations: PricingLocation[]) => locations.map((loc) => loc.location_type)
);

/**
 * Selects pagination details.
 */
export const selectPricingDetailsPagination = createSelector(
  selectPricingState,
  (state) => state.pagination
);

/**
 * Selects loading state.
 */
export const selectPricingDetailsLoading = createSelector(
  selectPricingState,
  (state) => state.loading
);

/**
 * Selects error message.
 */
export const selectPricingDetailsError = createSelector(
  selectPricingState,
  (state) => state.error
);
