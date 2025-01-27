import { RootState } from '../../../store/store';

export const selectProducts = (state: RootState) => state.products.data;
export const selectPagination = (state: RootState) => state.products.pagination;
export const selectLoading = (state: RootState) => state.products.loading;
export const selectError = (state: RootState) => state.products.error;
