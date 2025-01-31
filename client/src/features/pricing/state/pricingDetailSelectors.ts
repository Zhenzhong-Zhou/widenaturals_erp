import { RootState } from '../../../store/store';

/**
 * Selects pricing data from Redux state.
 */
export const selectPricing = (state: RootState) => state.pricing.pricing;

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
