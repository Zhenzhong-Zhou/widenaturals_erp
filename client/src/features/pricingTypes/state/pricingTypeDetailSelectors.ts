import { RootState } from '../../../store/store';

export const selectPricingDetails = (state: RootState) => state.pricingType.data;

export const selectPricingDetailsPagination = (state: RootState) => state.pricingType.pagination;

export const selectPricingDetailsIsLoading = (state: RootState) => state.pricingType.isLoading;

export const selectPricingDetailsError = (state: RootState) => state.pricingType.error;
