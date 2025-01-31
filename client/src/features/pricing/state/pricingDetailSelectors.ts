import { RootState } from '../../../store/store';

/**
 * Selects full pricing details from Redux state.
 */
export const selectPricing = (state: RootState) => state.pricing.pricing;

/**
 * Selects the product details from the pricing data.
 */
export const selectProduct = (state: RootState) => state.pricing.pricing?.product ?? null;

/**
 * Selects the location details from the pricing data.
 */
export const selectLocation = (state: RootState) => state.pricing.pricing?.location ?? null;

/**
 * Selects the location type details from the location.
 */
export const selectLocationType = (state: RootState) =>
  state.pricing.pricing?.location?.location_type ?? null;

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
