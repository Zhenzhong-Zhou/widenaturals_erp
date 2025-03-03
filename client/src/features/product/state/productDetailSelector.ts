import { RootState } from '../../../store/store';

export const selectProductDetail = (state: RootState) =>
  state.product.productDetail;
export const selectProductDetailLoading = (state: RootState) =>
  state.product.loading;
export const selectProductDetailError = (state: RootState) =>
  state.product.error;
