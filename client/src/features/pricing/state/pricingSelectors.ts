import { RootState } from '../../../store/store';

/**
 * Selects pricing data from Redux state.
 */
export const selectPricingData = (state: RootState) => state.pricings.data;

/**
 * Selects pagination details.
 */
export const selectPagination = (state: RootState) => state.pricings.pagination;

/**
 * Selects loading state.
 */
export const selectPricingLoading = (state: RootState) => state.pricings.loading;

/**
 * Selects error message.
 */
export const selectPricingError = (state: RootState) => state.pricings.error;
