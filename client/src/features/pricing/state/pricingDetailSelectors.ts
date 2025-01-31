import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

/**
 * Selects full pricing details from Redux state.
 */
export const selectPricing = (state: RootState) => state.pricing.pricing;

/**
 * Memoized selector for all products related to the pricing.
 */
export const selectProducts = createSelector(
  (state: RootState) => state.pricing.pricing?.products,
  (products) => products ?? [] // Ensures the same array reference if unchanged
);

/**
 * Memoized selector for all locations related to the pricing.
 */
export const selectLocations = createSelector(
  (state: RootState) => state.pricing.pricing?.locations,
  (locations) => locations ?? [] // Ensures the same array reference if unchanged
);

/**
 * Memoized selector for the first product (if needed for display).
 */
export const selectFirstProduct = createSelector(
  (state: RootState) => state.pricing.pricing?.products,
  (products) => products?.[0] ?? null
);

/**
 * Memoized selector for the first location (if needed for display).
 */
export const selectFirstLocation = createSelector(
  (state: RootState) => state.pricing.pricing?.locations,
  (locations) => locations?.[0] ?? null
);

/**
 * Memoized selector for all unique location types.
 */
export const selectLocationTypes = createSelector(
  selectLocations,
  (locations) => locations.map((loc) => loc.location_type) ?? [] // Ensures same reference
);

/**
 * Selects pagination details.
 */
export const selectPagination = (state: RootState) => state.pricing.pagination;

/**
 * Selects loading state.
 */
export const selectPricingLoading = (state: RootState) => state.pricing.loading;

/**
 * Selects error message.
 */
export const selectPricingError = (state: RootState) => state.pricing.error;
